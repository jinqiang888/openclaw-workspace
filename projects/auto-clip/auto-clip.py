#!/usr/bin/env python3
"""
Auto-Clip - 自动剪辑视频应用
功能：视频下载、自动切片、字幕提取、批量处理
"""

import argparse
import subprocess
import os
import json
import re
from pathlib import Path

# 配置
PYTHON = Path.home() / ".pyenv/versions/3.12.13/bin/python"
YTDLP = Path.home() / ".pyenv/versions/3.12.13/bin/yt-dlp"
FFMPEG = str(Path.home() / "bin/ffmpeg")
FFPROBE = str(Path.home() / "bin/ffprobe")

class AutoClip:
    def __init__(self, output_dir: str = "./output"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def download(self, url: str, format: str = "best") -> str:
        """下载视频（支持抖音/B站/YouTube）"""
        print(f"📥 下载视频: {url}")
        
        output_template = str(self.output_dir / "%(title)s.%(ext)s")
        
        cmd = [
            str(YTDLP),
            "-f", format,
            "-o", output_template,
            "--no-playlist",
            url
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"❌ 下载失败: {result.stderr}")
            return None
        
        # 提取下载的文件名
        for line in result.stderr.split("\n"):
            if "Destination:" in line or "has already" in line:
                match = re.search(r"Destination:\s*(.+)", line)
                if match:
                    print(f"✅ 下载完成: {match.group(1)}")
                    return match.group(1).strip()
        
        print("✅ 下载完成")
        return None
    
    def detect_silence(self, video_path: str, threshold: float = -35, duration: float = 0.5) -> list:
        """检测静音片段"""
        print(f"🔍 检测静音: {video_path}")
        
        cmd = [
            FFMPEG, "-i", video_path,
            "-af", f"silencedetect=noise={threshold}dB:d={duration}",
            "-f", "null", "-"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        silences = []
        silence_start = None
        
        for line in result.stderr.split("\n"):
            if "silence_start:" in line:
                match = re.search(r"silence_start:\s*([\d.]+)", line)
                if match:
                    silence_start = float(match.group(1))
            elif "silence_end:" in line and silence_start is not None:
                match = re.search(r"silence_end:\s*([\d.]+)", line)
                if match:
                    silence_end = float(match.group(1))
                    silences.append((silence_start, silence_end))
                    silence_start = None
        
        print(f"✅ 检测到 {len(silences)} 个静音片段")
        return silences
    
    def remove_silence(self, video_path: str, output_path: str = None) -> str:
        """去除静音片段"""
        if output_path is None:
            output_path = str(self.output_dir / f"no_silence_{Path(video_path).name}")
        
        print(f"✂️ 去除静音: {video_path}")
        
        silences = self.detect_silence(video_path)
        
        if not silences:
            print("⚠️ 未检测到静音片段，直接复制")
            subprocess.run([FFMPEG, "-i", video_path, "-c", "copy", output_path], check=True)
            return output_path
        
        # 计算非静音片段
        non_silent = []
        last_end = 0
        for start, end in silences:
            if start > last_end:
                non_silent.append((last_end, start))
            last_end = end
        
        # 获取视频总时长
        probe = subprocess.run([
            FFPROBE, "-v", "error", "-show_entries", "format=duration",
            "-of", "json", video_path
        ], capture_output=True, text=True)
        
        total_duration = float(json.loads(probe.stdout)["format"]["duration"])
        if last_end < total_duration:
            non_silent.append((last_end, total_duration))
        
        # 拼接非静音片段
        concat_file = str(self.output_dir / "concat.txt")
        with open(concat_file, "w") as f:
            for i, (start, end) in enumerate(non_silent):
                segment = str(self.output_dir / f"segment_{i}.ts")
                subprocess.run([
                    FFMPEG, "-i", video_path, "-ss", str(start), "-to", str(end),
                    "-c", "copy", "-bsf:v", "h264_mp4toannexb", "-f", "mpegts", segment
                ], capture_output=True)
                f.write(f"file '{segment}'\n")
        
        subprocess.run([
            FFMPEG, "-f", "concat", "-safe", "0", "-i", concat_file,
            "-c", "copy", output_path
        ], capture_output=True)
        
        # 清理临时文件
        for i in range(len(non_silent)):
            segment = self.output_dir / f"segment_{i}.ts"
            if segment.exists():
                segment.unlink()
        Path(concat_file).unlink(missing_ok=True)
        
        print(f"✅ 输出: {output_path}")
        return output_path
    
    def extract_audio(self, video_path: str, output_path: str = None) -> str:
        """提取音频"""
        if output_path is None:
            output_path = str(self.output_dir / f"{Path(video_path).stem}.wav")
        
        print(f"🎵 提取音频: {video_path}")
        
        subprocess.run([
            FFMPEG, "-i", video_path, "-vn", "-acodec", "pcm_s16le",
            "-ar", "16000", "-ac", "1", output_path, "-y"
        ], capture_output=True)
        
        print(f"✅ 音频: {output_path}")
        return output_path
    
    def transcribe(self, audio_path: str, model: str = "base") -> dict:
        """语音转文字（使用 Whisper）"""
        print(f"📝 语音识别: {audio_path} (模型: {model})")
        
        try:
            import whisper
            wm = whisper.load_model(model)
            result = wm.transcribe(audio_path)
            print(f"✅ 识别完成")
            return result
        except ImportError:
            print("❌ Whisper 未安装，请运行:")
            print(f"  {PYTHON} -m pip install openai-whisper")
            return None
    
    def generate_srt(self, segments: list, output_path: str) -> str:
        """生成 SRT 字幕文件"""
        print(f"📄 生成字幕: {output_path}")
        
        with open(output_path, "w", encoding="utf-8") as f:
            for i, seg in enumerate(segments, 1):
                start = self._format_time(seg["start"])
                end = self._format_time(seg["end"])
                f.write(f"{i}\n{start} --> {end}\n{seg['text'].strip()}\n\n")
        
        print(f"✅ 字幕: {output_path}")
        return output_path
    
    def _format_time(self, seconds: float) -> str:
        """格式化时间为 SRT 格式"""
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int((seconds - int(seconds)) * 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
    
    def auto_clip(self, video_path: str, clip_duration: int = 60) -> list:
        """自动切片（按固定时长切分）"""
        print(f"🎬 自动切片: {video_path} (每段 {clip_duration}秒)")
        
        # 获取视频时长
        probe = subprocess.run([
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "json", video_path
        ], capture_output=True, text=True)
        
        total_duration = float(json.loads(probe.stdout)["format"]["duration"])
        clips = []
        
        start = 0
        idx = 0
        while start < total_duration:
            output = str(self.output_dir / f"clip_{idx:03d}_{Path(video_path).stem}.mp4")
            subprocess.run([
                FFMPEG, "-i", video_path, "-ss", str(start), "-t", str(clip_duration),
                "-c", "copy", output, "-y"
            ], capture_output=True)
            clips.append(output)
            print(f"  ✂️ 切片 {idx}: {start:.0f}s - {min(start + clip_duration, total_duration):.0f}s")
            start += clip_duration
            idx += 1
        
        print(f"✅ 生成 {len(clips)} 个切片")
        return clips

def main():
    parser = argparse.ArgumentParser(description="Auto-Clip 自动剪辑视频")
    subparsers = parser.add_subparsers(dest="command", help="命令")
    
    # download 命令
    dl_parser = subparsers.add_parser("download", help="下载视频")
    dl_parser.add_argument("url", help="视频 URL")
    dl_parser.add_argument("-o", "--output", default="./output", help="输出目录")
    
    # clip 命令
    clip_parser = subparsers.add_parser("clip", help="自动切片")
    clip_parser.add_argument("video", help="视频文件")
    clip_parser.add_argument("-d", "--duration", type=int, default=60, help="切片时长（秒）")
    clip_parser.add_argument("-o", "--output", default="./output", help="输出目录")
    
    # silence 命令
    silence_parser = subparsers.add_parser("silence", help="去除静音")
    silence_parser.add_argument("video", help="视频文件")
    silence_parser.add_argument("-o", "--output", default="./output", help="输出目录")
    
    # subtitle 命令
    sub_parser = subparsers.add_parser("subtitle", help="提取字幕")
    sub_parser.add_argument("video", help="视频文件")
    sub_parser.add_argument("-m", "--model", default="base", help="Whisper 模型")
    sub_parser.add_argument("-o", "--output", default="./output", help="输出目录")
    
    args = parser.parse_args()
    
    if args.command is None:
        parser.print_help()
        return
    
    clipper = AutoClip(output_dir=getattr(args, "output", "./output"))
    
    if args.command == "download":
        clipper.download(args.url)
    
    elif args.command == "clip":
        clipper.auto_clip(args.video, args.duration)
    
    elif args.command == "silence":
        clipper.remove_silence(args.video)
    
    elif args.command == "subtitle":
        audio = clipper.extract_audio(args.video)
        if audio:
            result = clipper.transcribe(audio, args.model)
            if result:
                output_srt = str(Path(args.output) / f"{Path(args.video).stem}.srt")
                clipper.generate_srt(result["segments"], output_srt)

if __name__ == "__main__":
    main()