/**
 * HTTP 重试机制
 * 
 * 指数退避 + 超时控制 + 连接池
 * 
 * EvoMap 成熟方案 | GDI: 66.0 | 复用：945k+
 */

const https = require('https');
const http = require('http');

// 全局连接池
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
  freeSocketTimeout: 30000
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
  freeSocketTimeout: 30000
});

// 延迟
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 带重试的 HTTP 请求
 * 
 * @param {string} url - 请求 URL
 * @param {Object} options - 请求选项
 * @param {number} [options.timeout=5000] - 超时时间 (毫秒)
 * @param {number} [options.maxRetries=5] - 最大重试次数
 * @param {string} [options.backoff='exponential'] - 退避策略 (exponential|linear|fixed)
 * @param {number} [options.backoffMs=1000] - 初始退避时间 (毫秒)
 * @param {number} [options.maxBackoffMs=30000] - 最大退避时间 (毫秒)
 * @param {number[]} [options.retryOn=[429,500,502,503]] - 重试的状态码
 * @param {boolean} [options.log=false] - 是否输出日志
 * @returns {Promise<Object>} 响应对象
 */
async function fetchWithRetry(url, options = {}) {
  const {
    timeout = 5000,
    maxRetries = 5,
    backoff = 'exponential',
    backoffMs = 1000,
    maxBackoffMs = 30000,
    retryOn = [429, 500, 502, 503, 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT'],
    log = false,
    ...fetchOptions
  } = options;

  const logMsg = (msg) => log && console.log(`[HTTP-Retry] ${msg}`);

  let lastError = null;
  let attempt = 0;

  while (attempt <= maxRetries) {
    attempt++;
    logMsg(`尝试 ${attempt}/${maxRetries + 1} - ${url}`);

    try {
      const response = await doFetch(url, {
        ...fetchOptions,
        timeout,
        agent: url.startsWith('https') ? httpsAgent : httpAgent
      });

      // 检查是否需要重试
      if (retryOn.includes(response.status)) {
        logMsg(`状态码 ${response.status}，准备重试`);
        lastError = new Error(`HTTP ${response.status}`);
        lastError.code = response.status;
        lastError.status = response.status;
      } else {
        logMsg(`请求成功 - ${response.status}`);
        return response;
      }

    } catch (error) {
      lastError = error;
      logMsg(`请求失败：${error.message} (${error.code || 'UNKNOWN'})`);

      // 检查是否是可重试的错误
      const isRetryable = retryOn.some(code => 
        error.code === code || 
        error.message.includes(code) ||
        (typeof code === 'number' && error.status === code)
      );

      if (!isRetryable) {
        logMsg(`不可重试的错误，放弃`);
        throw error;
      }
    }

    // 如果是最后一次尝试，直接抛出错误
    if (attempt > maxRetries) {
      logMsg(`已达最大重试次数，放弃`);
      throw lastError;
    }

    // 计算退避时间
    const delay = calculateBackoff(attempt, backoff, backoffMs, maxBackoffMs);
    logMsg(`等待 ${delay}ms 后重试...`);
    await sleep(delay);
  }

  throw lastError;
}

/**
 * 实际执行 HTTP 请求
 */
async function doFetch(url, options = {}) {
  const { timeout = 5000, agent, method = 'GET', headers = {}, body = null } = options;

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers,
      agent,
      timeout
    };

    const req = lib.request(reqOptions, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        // 尝试解析 JSON
        let parsedData = data;
        const contentType = res.headers['content-type'] || '';
        
        if (contentType.includes('application/json')) {
          try {
            parsedData = JSON.parse(data);
          } catch (e) {
            // 解析失败，保持原始数据
          }
        }

        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsedData,
          ok: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      const error = new Error('Request timeout');
      error.code = 'ETIMEDOUT';
      reject(error);
    });

    // 发送请求体
    if (body) {
      if (typeof body === 'string') {
        req.write(body);
      } else if (typeof body === 'object') {
        req.write(JSON.stringify(body));
      }
    }

    req.end();
  });
}

/**
 * 计算退避时间
 */
function calculateBackoff(attempt, strategy, baseDelay, maxDelay) {
  let delay;

  switch (strategy) {
    case 'exponential':
      delay = baseDelay * Math.pow(2, attempt - 1);
      break;
    case 'linear':
      delay = baseDelay * attempt;
      break;
    case 'fixed':
    default:
      delay = baseDelay;
      break;
  }

  // 添加随机抖动 (0-1000ms)，避免多个请求同时重试
  const jitter = Math.random() * 1000;
  
  return Math.min(delay + jitter, maxDelay);
}

/**
 * 简化的 fetch 包装器
 */
async function get(url, options = {}) {
  const response = await fetchWithRetry(url, { ...options, method: 'GET' });
  return response.data;
}

async function post(url, data, options = {}) {
  const response = await fetchWithRetry(url, {
    ...options,
    method: 'POST',
    body: data,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  return response.data;
}

module.exports = {
  fetchWithRetry,
  get,
  post,
  httpAgent,
  httpsAgent,
  sleep,
  calculateBackoff
};
