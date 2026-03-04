# Auto-Clip - 自动剪辑视频应用

## 功能

- 📥 视频下载（抖音/B站/YouTube）
- ✂️ 自动切片（静音去除、精彩片段）
- 📝 自动字幕（语音识别）
- 🎬 批量处理

## 安装

```bash
# ffmpeg (需要 sudo)
sudo yum install -y ffmpeg

# Python 依赖
~/.pyenv/versions/3.12.13/bin/pip install openai-whisper

# 可选：GUI 支持
~/.pyenv/versions/3.12.13/bin/pip install gradio
```

## 使用

```bash
# 下载视频
./auto-clip.py download "https://www.bilibili.com/video/BVxxx"

# 自动剪辑
./auto-clip.py clip input.mp4 --output clips/

# 提取字幕
./auto-clip.py subtitle input.mp4 --output subtitle.srt
```