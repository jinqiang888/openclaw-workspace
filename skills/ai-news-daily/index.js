/**
 * AI 热点资讯日报
 * 
 * 每天 9:00 推送近 24 小时热门 10 个 AI 资讯
 */

const fs = require('fs').promises;
const path = require('path');

const WORKSPACE = '/home/admin/.openclaw/workspace';
const MEMORY_DIR = path.join(WORKSPACE, 'memory');

// 确保目录存在
async function ensureDirs() {
  await fs.mkdir(MEMORY_DIR, { recursive: true });
}

// 获取今日日期
function getToday() {
  return new Date().toISOString().split('T')[0];
}

/**
 * 获取 GitHub Trending AI 项目
 */
async function getGitHubTrending() {
  try {
    // GitHub Trending API (无需认证)
    const response = await fetch('https://api.github.com/search/repositories?q=ai+agent&sort=stars&order=desc&per_page=10');
    const data = await response.json();
    
    const repos = (data.items || []).map(repo => ({
      title: `${repo.name} - ${repo.description?.split('.')[0] || 'AI 项目'}`,
      source: 'GitHub Trending',
      url: repo.html_url,
      hotness: `${repo.stargazers_count || 0} ⭐`,
      summary: repo.description || '',
      keyPoints: [
        `Stars: ${repo.stargazers_count || 0}`,
        `Forks: ${repo.forks_count || 0}`,
        `语言：${repo.language || 'Unknown'}`,
        `更新：${repo.updated_at?.split('T')[0] || '未知'}`
      ],
      readTime: '1 分钟',
      publishedAt: repo.updated_at
    }));
    
    return {
      source: 'GitHub Trending',
      articles: repos,
      count: repos.length
    };
  } catch (e) {
    return {
      source: 'GitHub Trending',
      articles: [],
      count: 0,
      error: e.message
    };
  }
}

/**
 * 获取 Hacker News AI 相关讨论
 */
async function getHackerNews() {
  try {
    // Hacker News Top Stories
    const topResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const topIds = await topResponse.json();
    
    // 获取前 20 条详情
    const stories = await Promise.all(
      topIds.slice(0, 20).map(async id => {
        const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        return storyResponse.json();
      })
    );
    
    // 筛选 AI 相关
    const aiStories = stories
      .filter(s => s && s.title && (
        s.title.toLowerCase().includes('ai') ||
        s.title.toLowerCase().includes('llm') ||
        s.title.toLowerCase().includes('gpt') ||
        s.title.toLowerCase().includes('agent')
      ))
      .slice(0, 5)
      .map(story => ({
        title: story.title,
        source: 'Hacker News',
        url: `https://news.ycombinator.com/item?id=${story.id}`,
        hotness: `${story.score || 0} 分 | ${story.descendants || 0} 评论`,
        summary: `讨论热度：${story.score || 0} 分，${story.descendants || 0} 条评论`,
        keyPoints: [
          `分数：${story.score || 0}`,
          `评论：${story.descendants || 0}`,
          `用户：${story.by || '未知'}`,
          `时间：${new Date(story.time * 1000).toLocaleString('zh-CN')}`
        ],
        readTime: '3 分钟',
        publishedAt: new Date(story.time * 1000).toISOString()
      }));
    
    return {
      source: 'Hacker News',
      articles: aiStories,
      count: aiStories.length
    };
  } catch (e) {
    return {
      source: 'Hacker News',
      articles: [],
      count: 0,
      error: e.message
    };
  }
}

/**
 * 获取 B 站 AI 区热门视频
 */
async function getBilibiliVideos() {
  try {
    // B 站热门 API (无需认证)
    const response = await fetch('https://api.bilibili.com/x/web-interface/ranking/v2?rid=188&tid=0&type=all&page_size=10');
    const data = await response.json();
    
    const videos = (data.data?.list || []).map(video => ({
      title: video.title,
      source: 'B 站',
      url: `https://www.bilibili.com/video/${video.bvid}`,
      hotness: `${video.stat?.view || 0} 播放 | ${video.stat?.like || 0} 点赞`,
      summary: `UP 主：${video.owner?.name || '未知'} | ${video.desc?.substring(0, 100) || ''}...`,
      keyPoints: [
        `播放：${video.stat?.view || 0}`,
        `点赞：${video.stat?.like || 0}`,
        `弹幕：${video.stat?.danmaku || 0}`,
        `时长：${Math.round((video.duration || 0) / 60)} 分钟`
      ],
      readTime: `${Math.round((video.duration || 300) / 60)} 分钟`,
      publishedAt: new Date(video.pubdate * 1000).toISOString()
    }));
    
    return {
      source: 'B 站',
      videos,
      count: videos.length
    };
  } catch (e) {
    return {
      source: 'B 站',
      videos: [],
      count: 0,
      error: e.message
    };
  }
}

/**
 * 获取 X (Twitter) 热门动态
 */
async function getTwitterTweets() {
  return {
    source: 'X (Twitter)',
    tweets: [],
    note: '需要 Twitter API'
  };
}

/**
 * 获取 YouTube 热门视频
 */
async function getYouTubeVideos() {
  return {
    source: 'YouTube',
    videos: [],
    note: '需要 YouTube API'
  };
}

/**
 * 获取 Tavily AI 热点新闻
 */
async function getTavilyAINews() {
  try {
    // 使用 Tavily 搜索最新 AI 新闻
    const searchQuery = 'AI artificial intelligence news latest 2026';
    
    // Tavily API Key
    const apiKey = process.env.TAVILY_API_KEY || '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';
    
    // 调用 Tavily API
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        query: searchQuery,
        topic: 'news',
        time_range: 'day',
        days: 1,
        max_results: 10,
        include_content: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const articles = (data.results || []).map(result => ({
      title: result.title || 'AI 新闻',
      source: 'Tavily Search',
      url: result.url,
      hotness: `${Math.round(result.score * 100) || 0} 分`,
      summary: result.content?.substring(0, 200) || '',
      keyPoints: [
        `来源：${result.source || '未知'}`,
        `发布时间：${result.published_date || '最近 24 小时'}`,
        `相关性：${Math.round(result.score * 100) || 0}%`
      ],
      readTime: '3 分钟',
      publishedAt: result.published_date || new Date().toISOString()
    }));
    
    return {
      source: 'Tavily Search',
      articles,
      count: articles.length
    };
  } catch (e) {
    console.error('Tavily API 错误:', e.message);
    return {
      source: 'Tavily Search',
      articles: [],
      count: 0,
      error: e.message
    };
  }
}

/**
 * 获取 EvoMap 热门资产
 */
async function getEvoMapAssets() {
  try {
    // 调用 EvoMap API 获取高 GDI 资产
    const response = await fetch('https://evomap.ai/a2a/assets/ranked?limit=10');
    const data = await response.json();
    
    const assets = (data.assets || []).map(asset => ({
      title: asset.payload?.summary?.split(':')[0] || 'AI 资产更新',
      source: 'EvoMap',
      url: `https://evomap.ai/a2a/assets/${asset.asset_id}`,
      hotness: `${asset.reuse_count || 0} 复用`,
      gdi: asset.gdi_score || 0,
      summary: asset.payload?.summary || '',
      keyPoints: [
        `GDI 评分：${asset.gdi_score || 0}`,
        `复用次数：${asset.reuse_count || 0}`,
        `成功连击：${asset.success_streak || 0}`,
        `触发信号：${(asset.payload?.signals_match || []).slice(0, 3).join(', ')}`
      ],
      readTime: '2 分钟',
      publishedAt: asset.created_at
    }));
    
    return {
      source: 'EvoMap',
      assets,
      count: assets.length
    };
  } catch (e) {
    return {
      source: 'EvoMap',
      assets: [],
      count: 0,
      error: e.message
    };
  }
}

/**
 * 获取 AI 社区热门讨论
 */
async function getAICommunityPosts() {
  return {
    source: 'AI 社区',
    posts: [],
    note: '需要配置社区 API (Reddit、Discord 等)'
  };
}

/**
 * 综合获取热门资讯
 */
async function getHotNews(options = {}) {
  const {
    hours = 24,
    limit = 10,
    sources = ['tavily', 'evomap', 'github', 'hackernews']
  } = options;

  const results = {
    timestamp: new Date().toISOString(),
    timeRange: {
      from: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString()
    },
    sources: [],
    topNews: []
  };

  // 收集各渠道资讯
  if (sources.includes('tavily')) {
    const tavily = await getTavilyAINews();
    results.sources.push(tavily);
  }

  if (sources.includes('evomap')) {
    const evomap = await getEvoMapAssets();
    results.sources.push(evomap);
  }

  if (sources.includes('github')) {
    const github = await getGitHubTrending();
    results.sources.push(github);
  }

  if (sources.includes('hackernews')) {
    const hn = await getHackerNews();
    results.sources.push(hn);
  }

  if (sources.includes('bilibili')) {
    const bilibili = await getBilibiliVideos();
    results.sources.push(bilibili);
  }

  // 合并所有资讯
  const allNews = [];
  results.sources.forEach(source => {
    const items = source.articles || source.videos || source.assets || source.posts || [];
    allNews.push(...items.map(item => ({
      ...item,
      source: source.source
    })));
  });

  // 按热度排序并取 Top N
  allNews.sort((a, b) => {
    const aHotness = parseInt(String(a.hotness).replace(/\D/g, '')) || 0;
    const bHotness = parseInt(String(b.hotness).replace(/\D/g, '')) || 0;
    return bHotness - aHotness;
  });

  results.topNews = allNews.slice(0, limit);

  return results;
}

/**
 * 获取资讯详细内容
 */
async function fetchNewsDetails(item) {
  // 如果有 URL，尝试抓取页面内容
  if (item.url) {
    try {
      // 简化处理，实际需要 web_fetch
      return {
        summary: item.summary || '点击链接查看详情',
        keyPoints: item.keyPoints || [],
        readTime: item.readTime || '3 分钟'
      };
    } catch (e) {
      // 忽略错误
    }
  }
  
  return {
    summary: item.summary || '',
    keyPoints: item.keyPoints || [],
    readTime: item.readTime || '未知'
  };
}

/**
 * 生成资讯日报
 */
async function generateDailyDigest(options = {}) {
  const { limit = 10, detailed = true } = options;

  const news = await getHotNews({ hours: 24, limit });

  // 生成日报内容
  let content = `# AI 热点资讯日报 ${getToday()}\n\n`;
  content += `**时间范围**: ${news.timeRange.from.split('T')[0]} ~ ${news.timeRange.to.split('T')[0]}\n\n`;
  content += `**数据来源**: ${news.sources.map(s => s.source).join(', ')}\n\n`;
  
  content += `## 🔥 Top ${limit} 热门资讯\n\n`;

  if (news.topNews.length === 0) {
    content += '*暂无数据，需要配置各渠道 API*\n\n';
  } else {
    news.topNews.forEach((item, index) => {
      content += `### ${index + 1}. ${item.title || '待填充'}\n\n`;
      content += `**来源**: ${item.source} | **热度**: ${item.hotness || '待统计'} | **阅读时间**: ${item.details?.readTime || '未知'}\n\n`;
      
      if (item.details?.summary) {
        content += `**摘要**:\n`;
        content += `${item.details.summary}\n\n`;
      }
      
      if (item.details?.keyPoints && item.details.keyPoints.length > 0) {
        content += `**关键要点**:\n`;
        item.details.keyPoints.forEach(point => {
          content += `- ${point}\n`;
        });
        content += '\n';
      }
      
      if (item.url) {
        content += `[阅读原文](${item.url})\n\n`;
      }
      
      content += `---\n\n`;
    });
  }

  content += `## 📊 趋势分析\n\n`;
  content += `- 热门话题：待填充\n`;
  content += `- 新技术：待填充\n`;
  content += `- 工具更新：待填充\n\n`;

  content += `## 💡 对 OpenClaw 的启发\n\n`;
  content += `- 可学习的技能：待填充\n`;
  content += `- 可优化的配置：待填充\n`;
  content += `- 可集成的工具：待填充\n`;

  // 保存到文件
  await ensureDirs();
  const digestFile = path.join(MEMORY_DIR, `ai-news-${getToday()}.md`);
  await fs.writeFile(digestFile, content);

  return {
    success: true,
    content,
    file: digestFile,
    newsCount: news.topNews.length
  };
}

/**
 * 获取历史资讯
 */
async function getHistoricalNews(date) {
  const newsFile = path.join(MEMORY_DIR, `ai-news-${date}.md`);
  
  try {
    const content = await fs.readFile(newsFile, 'utf-8');
    return {
      success: true,
      content,
      file: newsFile
    };
  } catch (e) {
    return {
      success: false,
      error: '未找到该日期的资讯',
      date
    };
  }
}

module.exports = {
  getHotNews,
  generateDailyDigest,
  getHistoricalNews,
  getTavilyAINews,
  getEvoMapAssets,
  getGitHubTrending,
  getHackerNews,
  getBilibiliVideos
};
