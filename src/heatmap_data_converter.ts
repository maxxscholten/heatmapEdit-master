import _ from 'lodash';

var VALUE_INDEX = 0;
var TIME_INDEX = 1;

interface XBucket {
  x: number;
  buckets: any;
}

interface YBucket {
  y: number;
  values: number[];
}

function elasticHistogramToHeatmap(seriesList) {
  var heatmap = {};

  for (var series of seriesList) {
    var bound = Number(series.alias);
    if (isNaN(bound)) {
      return heatmap;
    }

    for (var point of series.datapoints) {
      var count = point[VALUE_INDEX];
      var time = point[TIME_INDEX];

      if (!_.isNumber(count)) {
        continue;
      }

      var bucket = heatmap[time];
      if (!bucket) {
        bucket = heatmap[time] = {x: time, buckets: {}};
      }

      bucket.buckets[bound] = {
        y: bound,
        count: count,
        bounds: {
          top: null,
          bottom: bound
        },
        values: [],
        points: []
      };
    }
  }

  return heatmap;
}

/**
 * Convert buckets into linear array of "cards" - objects, represented heatmap elements.
 * @param  {Object} buckets
 * @return {Array}          Array of "card" objects
 */
function convertToCards(buckets) {
  var min = 0, max = 0;
  var cards = [];
  _.forEach(buckets, xBucket => {
    _.forEach(xBucket.buckets, yBucket=> {
      var card = {
        x: xBucket.x,
        y: yBucket.y,
        yBounds: yBucket.bounds,
        values: yBucket.values,
        count: yBucket.count,
      };
      cards.push(card);

      if (cards.length === 1) {
        min = yBucket.count;
        max = yBucket.count;
      }

      min = yBucket.count < min ? yBucket.count : min;
      max = yBucket.count > max ? yBucket.count : max;
    });
  });

  var cardStats = {min, max};
  return {cards, cardStats};
}

/**
 * Special method for log scales. When series converted into buckets with log scale,
 * for simplification, 0 values are converted into 0, not into -Infinity. On the other hand, we mean
 * that all values less than series minimum, is 0 values, and we create special "minimum" bucket for
 * that values (actually, there're no values less than minimum, so this bucket is empty).
 *  8-16|    | ** |    |  * |  **|
 *   4-8|  * |*  *|*   |** *| *  |
 *   2-4| * *|    | ***|    |*   |
 *   1-2|*   |    |    |    |    | This bucket contains minimum series value
 * 0.5-1|____|____|____|____|____| This bucket should be displayed as 0 on graph
 *     0|____|____|____|____|____| This bucket is for 0 values (should actually be -Infinity)
 * So we should merge two bottom buckets into one (0-value bucket).
 *
 * @param  {Object} buckets  Heatmap buckets
 * @param  {Number} minValue Minimum series value
 * @return {Object}          Transformed buckets
 */
function mergeZeroBuckets(buckets, minValue) {
  _.forEach(buckets, xBucket => {
    var yBuckets = xBucket.buckets;

    var emptyBucket = {
      bounds: {bottom: 0, top: 0},
      values: [],
      points: [],
      count: 0,
    };

    var nullBucket = yBuckets[0] || emptyBucket;
    var minBucket = yBuckets[minValue] || emptyBucket;

    var newBucket = {
      y: 0,
      bounds: {bottom: minValue, top: minBucket.bounds.top || minValue},
      values: [],
      points: [],
      count: 0,
    };

    newBucket.points = nullBucket.points.concat(minBucket.points);
    newBucket.values = nullBucket.values.concat(minBucket.values);
    newBucket.count = newBucket.values.length;

    if (newBucket.count === 0) {
      return;
    }

    delete yBuckets[minValue];
    yBuckets[0] = newBucket;
  });

  return buckets;
}

/**
   * Convert set of time series into heatmap buckets
   * @return {Object}    Heatmap object:
 * {
 *   xBucketBound_1: {
 *     x: xBucketBound_1,
 *     buckets: {
 *       yBucketBound_1: {
 *         y: yBucketBound_1,
 *         bounds: {bottom, top}
 *         values: [val_1, val_2, ..., val_K],
 *         points: [[val_Y, val_X, series_name], ..., [...]],
 *         seriesStat: {seriesName_1: val_1, seriesName_2: val_2}
 *       },
 *       ...
 *       yBucketBound_M: {}
 *     },
 *     values: [val_1, val_2, ..., val_K],
 *     points: [
 *       [val_Y, val_X, series_name], (point_1)
 *       ...
 *       [...] (point_K)
 *     ]
 *   },
 *   xBucketBound_2: {},
 *   ...
 *   xBucketBound_N: {}
 * }
 */
function convertToHeatMap(seriesList, yBucketSize, xBucketSize, logBase = 1) {
  var heatmap = {};

  for (var series of seriesList) {
    var datapoints = series.datapoints;
    var seriesName = series.label;

    // Slice series into X axis buckets
    // |    | ** |    |  * |  **|
    // |  * |*  *|*   |** *| *  |
    // |** *|    | ***|    |*   |
    // |____|____|____|____|____|_
    //
    _.forEach(datapoints, point => {
      var bucketBound = getBucketBound(point[TIME_INDEX], xBucketSize);
      pushToXBuckets(heatmap, point, bucketBound, seriesName);
    });
  }

  // Slice X axis buckets into Y (value) buckets
  // |  **|     |2|,
  // | *  | --\ |1|,
  // |*   | --/ |1|,
  // |____|     |0|
  //
  _.forEach(heatmap, xBucket => {
    if (logBase !== 1) {
      xBucket.buckets = convertToLogScaleValueBuckets(xBucket, yBucketSize, logBase);
    } else {
      xBucket.buckets = convertToValueBuckets(xBucket, yBucketSize);
    }
  });

  return heatmap;
}

function pushToXBuckets(buckets, point, bucketNum, seriesName) {
  var value = point[VALUE_INDEX];
  if (value === null || value === undefined || isNaN(value)) { return; }

  // Add series name to point for future identification
  var point_ext = _.concat(point, seriesName);

  if (buckets[bucketNum] && buckets[bucketNum].values) {
    buckets[bucketNum].values.push(value);
    buckets[bucketNum].points.push(point_ext);
  } else {
    buckets[bucketNum] = {
      x: bucketNum,
      values: [value],
      points: [point_ext]
    };
  }
}

function pushToYBuckets(buckets, bucketNum, value, point, bounds) {
  var count = 1;
  // Use the 3rd argument as scale/count
  if (point.length > 3) {
    count = parseInt(point[2]);
  }
  if (buckets[bucketNum]) {
    buckets[bucketNum].values.push(value);
    buckets[bucketNum].points.push(point);
    buckets[bucketNum].count += count;
  } else {
    buckets[bucketNum] = {
      y: bucketNum,
      bounds: bounds,
      values: [value],
      points: [point],
      count: count,
    };
  }
}

function getValueBucketBound(value, yBucketSize, logBase) {
  if (logBase === 1) {
    return getBucketBound(value, yBucketSize);
  } else {
    return getLogScaleBucketBound(value, yBucketSize, logBase);
  }
}

/**
 * Find bucket for given value (for linear scale)
 */
function getBucketBounds(value, bucketSize) {
  var bottom, top;
  bottom = Math.floor(value / bucketSize) * bucketSize;
  top = (Math.floor(value / bucketSize) + 1) * bucketSize;

  return {bottom, top};
}

function getBucketBound(value, bucketSize) {
  var bounds = getBucketBounds(value, bucketSize);
  return bounds.bottom;
}

function convertToValueBuckets(xBucket, bucketSize) {
  var values = xBucket.values;
  var points = xBucket.points;
  var buckets = {};

  _.forEach(values, (val, index) => {
    var bounds = getBucketBounds(val, bucketSize);
    var bucketNum = bounds.bottom;
    pushToYBuckets(buckets, bucketNum, val, points[index], bounds);
  });

  return buckets;
}

/**
 * Find bucket for given value (for log scales)
 */
function getLogScaleBucketBounds(value, yBucketSplitFactor, logBase) {
  var top, bottom;
  if (value === 0) {
    return {bottom: 0, top: 0};
  }

  var value_log = logp(value, logBase);
  var pow, powTop;
  if (yBucketSplitFactor === 1 || !yBucketSplitFactor) {
    pow = Math.floor(value_log);
    powTop = pow + 1;
  } else {
    var additional_bucket_size = 1 / yBucketSplitFactor;
    var additional_log = value_log - Math.floor(value_log);
    additional_log = Math.floor(additional_log / additional_bucket_size) * additional_bucket_size;
    pow = Math.floor(value_log) + additional_log;
    powTop = pow + additional_bucket_size;
  }
  bottom = Math.pow(logBase, pow);
  top = Math.pow(logBase, powTop);

  return {bottom, top};
}

function getLogScaleBucketBound(value, yBucketSplitFactor, logBase) {
  var bounds = getLogScaleBucketBounds(value, yBucketSplitFactor, logBase);
  return bounds.bottom;
}

function convertToLogScaleValueBuckets(xBucket, yBucketSplitFactor, logBase) {
  var values = xBucket.values;
  var points = xBucket.points;

  var buckets = {};
  _.forEach(values, (val, index) => {
    var bounds = getLogScaleBucketBounds(val, yBucketSplitFactor, logBase);
    var bucketNum = bounds.bottom;
    pushToYBuckets(buckets, bucketNum, val, points[index], bounds);
  });

  return buckets;
}

/**
 * Logarithm for custom base
 * @param value
 * @param base logarithm base
 */
function logp(value, base) {
  return Math.log(value) / Math.log(base);
}

/**
 * Calculate size of Y bucket from given buckets bounds.
 * @param bounds Array of Y buckets bounds
 * @param logBase Logarithm base
 */
function calculateBucketSize(bounds: number[], logBase = 1): number {
  var bucketSize = Infinity;

  if (bounds.length === 0) {
    return 0;
  } else if (bounds.length === 1) {
    return bounds[0];
  } else {
    bounds = _.sortBy(bounds);
    for (var i = 1; i < bounds.length; i++) {
      var distance = getDistance(bounds[i], bounds[i - 1], logBase);
      bucketSize = distance < bucketSize ? distance : bucketSize;
    }
  }

  return bucketSize;
}

/**
 * Calculate distance between two numbers in given scale (linear or logarithmic).
 * @param a
 * @param b
 * @param logBase
 */
function getDistance(a: number, b: number, logBase = 1): number {
  if (logBase === 1) {
    // Linear distance
    return Math.abs(b - a);
  } else {
    // logarithmic distance
    var ratio = Math.max(a, b) / Math.min(a, b);
    return logp(ratio, logBase);
  }
}

/**
 * Compare two heatmap data objects
 * @param objA
 * @param objB
 */
function isHeatmapDataEqual(objA: any, objB: any): boolean {
  var is_eql = !emptyXOR(objA, objB);

  _.forEach(objA, (xBucket: XBucket, x) => {
    if (objB[x]) {
      if (emptyXOR(xBucket.buckets, objB[x].buckets)) {
        is_eql = false;
        return false;
      }

      _.forEach(xBucket.buckets, (yBucket: YBucket, y) => {
        if (objB[x].buckets && objB[x].buckets[y]) {
          if (objB[x].buckets[y].values) {
            is_eql = _.isEqual(_.sortBy(yBucket.values), _.sortBy(objB[x].buckets[y].values));
            if (!is_eql) {
              return false;
            } else {
              return true;
            }
          } else {
            is_eql = false;
            return false;
          }
        } else {
          is_eql = false;
          return false;
        }
      });

      if (!is_eql) {
        return false;
      } else {
        return true;
      }
    } else {
      is_eql = false;
      return false;
    }
  });

  return is_eql;
}

function emptyXOR(foo: any, bar: any): boolean {
  return (_.isEmpty(foo) || _.isEmpty(bar)) && !(_.isEmpty(foo) && _.isEmpty(bar));
}

export {
  convertToHeatMap,
  elasticHistogramToHeatmap,
  convertToCards,
  mergeZeroBuckets,
  getValueBucketBound,
  isHeatmapDataEqual,
  calculateBucketSize
};
