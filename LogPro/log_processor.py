import os
import json
import pandas as pd
from datetime import datetime
from pathlib import Path
from tqdm import tqdm
from loguru import logger
import argparse
from typing import Dict, List, Union, Optional
import time
import zipfile
import tarfile



class LogProcessor:
    def __init__(self, input_dir: str, output_dir: str):
        print("\n 1508")
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        
        # 检查并创建输入目录
        if not self.input_dir.exists():
            self.input_dir.mkdir(parents=True, exist_ok=True)
            logger.warning(f"输入目录 {input_dir} 不存在，已自动创建")
        print("\n 目录：")
        print("\n 目录：{input_dir}")
        #解压文件夹
        self.extract_archives(input_dir)
        self.extract_archives(input_dir)
        # 检查并创建输出目录
        if not self.output_dir.exists():
            self.output_dir.mkdir(parents=True, exist_ok=True)
            logger.warning(f"输出目录 {output_dir} 不存在，已自动创建")
        
    def process_logs(self, 
                    keywords: Optional[List[str]] = None,
                    log_level: Optional[str] = None,
                    file_pattern: str = "*.log"):
        """
        处理日志文件
        
        Args:
            keywords: 关键词列表
            log_level: 日志级别
            file_pattern: 文件匹配模式
        """

                
        # 递归查找所有匹配的文件
        log_files = []
        for root, _, files in os.walk(self.input_dir):
            for file in files:
                if file.endswith(file_pattern.replace('*', '')):
                    log_files.append(Path(root) / file)
        
        if not log_files:
            logger.warning(f"在 {self.input_dir} 及其子目录中没有找到匹配的文件")
            return

        for log_file in tqdm(log_files, desc="处理日志文件"):
            try:
                self._process_single_file(log_file, keywords, log_level)
            except Exception as e:
                logger.error(f"处理文件 {log_file} 时出错: {str(e)}")
        
        # 等待1秒后开始汇总
        print("\n等待1秒后开始汇总日志...")
        time.sleep(1)
        
        # 处理完成后汇总日志
        self._summarize_logs()

    def _process_single_file(self, 
                           log_file: Path,
                           keywords: Optional[List[str]],
                           log_level: Optional[str]):
        """处理单个日志文件"""
        # 保持原始目录结构
        relative_path = log_file.relative_to(self.input_dir)
        output_file = self.output_dir / relative_path
        
        # 确保输出目录存在
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(log_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        filtered_lines = []
        for line in lines:
            if self._match_conditions(line, keywords, log_level):
                filtered_lines.append(line)
        
        if filtered_lines:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.writelines(filtered_lines)
            logger.info(f"已处理文件 {log_file.name}，找到 {len(filtered_lines)} 条匹配记录")

    def _match_conditions(self,
                         line: str,
                         keywords: Optional[List[str]],
                         log_level: Optional[str]) -> bool:
        """检查日志行是否匹配所有条件"""
        # 关键词检查（不区分大小写，支持部分匹配）
        if keywords:
            line_lower = line.lower()
            if not any(keyword.lower() in line_lower for keyword in keywords):
                return False
        
        # 日志级别检查（不区分大小写）
        if log_level:
            if log_level.upper() not in line.upper():
                return False
        
        return True

    def _summarize_logs(self):
        """汇总所有子文件夹中的日志文件"""
        print("\n开始汇总日志文件...")
        
        # 用于存储所有汇总内容
        all_summary_content = []
        
        # 首先处理根目录下的日志文件
        root_log_files = [f for f in self.output_dir.glob('*.log') if not f.name.startswith('summary_')]
        if root_log_files:
            root_log_files.sort()
            root_summary_file = self.output_dir / "000_root_summary.log"
            try:
                with open(root_summary_file, 'w', encoding='utf-8') as summary_f:
                    summary_f.write("=== 根目录日志汇总 ===\n\n")
                    for log_file in root_log_files:
                        try:
                            with open(log_file, 'r', encoding='utf-8') as f:
                                content = f.read()
                                if content.strip():
                                    summary_f.write(f"--- 来自文件: {log_file.name} ---\n")
                                    summary_f.write(content)
                                    summary_f.write("\n\n")
                                    all_summary_content.append(f"=== 来自根目录 ===\n")
                                    all_summary_content.append(f"--- 来自文件: {log_file.name} ---\n")
                                    all_summary_content.append(content)
                                    all_summary_content.append("\n\n")
                        except Exception as e:
                            logger.error(f"读取文件 {log_file} 时出错: {str(e)}")
                logger.info(f"已创建根目录汇总文件: {root_summary_file}")
            except Exception as e:
                logger.error(f"创建根目录汇总文件时出错: {str(e)}")
        
        # 遍历所有子文件夹
        for root, _, files in os.walk(self.output_dir):
            root_path = Path(root)
            if root_path == self.output_dir:
                continue  # 跳过根目录
            
            # 获取该文件夹下的所有日志文件（排除汇总文件）
            log_files = [f for f in files if f.endswith('.log') and not f.startswith('summary_')]
            if not log_files:
                continue
            
            # 按文件名排序
            log_files.sort()
            
            # 创建子文件夹的汇总文件
            summary_file = root_path / "000_summary.log"
            try:
                with open(summary_file, 'w', encoding='utf-8') as summary_f:
                    # 写入汇总文件头
                    summary_f.write(f"=== 汇总日志: {root_path.name} ===\n\n")
                    
                    # 遍历并合并所有日志文件
                    for log_file in log_files:
                        log_path = root_path / log_file
                        try:
                            with open(log_path, 'r', encoding='utf-8') as f:
                                content = f.read()
                                if content.strip():  # 只在有内容时写入
                                    summary_f.write(f"--- 来自文件: {log_file} ---\n")
                                    summary_f.write(content)
                                    summary_f.write("\n\n")
                                    # 同时收集内容用于总汇总文件
                                    all_summary_content.append(f"=== 来自文件夹: {root_path.name} ===\n")
                                    all_summary_content.append(f"--- 来自文件: {log_file} ---\n")
                                    all_summary_content.append(content)
                                    all_summary_content.append("\n\n")
                        except Exception as e:
                            logger.error(f"读取文件 {log_file} 时出错: {str(e)}")
                            continue
                
                logger.info(f"已创建汇总文件: {summary_file}")
                
            except Exception as e:
                logger.error(f"创建汇总文件时出错: {str(e)}")
                continue
        
        # 创建总汇总文件
        if all_summary_content:
            total_summary_file = self.output_dir / "000_total_summary.log"
            try:
                with open(total_summary_file, 'w', encoding='utf-8') as f:
                    f.write("=== 总汇总日志 ===\n\n")
                    f.writelines(all_summary_content)
                logger.info(f"已创建总汇总文件: {total_summary_file}")
            except Exception as e:
                logger.error(f"创建总汇总文件时出错: {str(e)}")
        
        print("日志汇总完成！")
        
    def extract_archives(self,input_dir : str, output_dir=None, recursive=True, delete_after=False):
        """
        解压指定文件夹下的所有压缩包
        
        参数：
        input_dir: 要处理的文件夹路径
        output_dir: 解压目标目录（默认使用压缩文件所在目录）
        recursive: 是否递归解压子文件夹中的压缩文件
        delete_after: 解压后是否删除原压缩文件
        """
        print("\n开始解压文件夹")
        # 支持的压缩格式
        supported_formats = {
            '.zip': (zipfile.ZipFile, 'r'),
            '.log.zip': (zipfile.ZipFile, 'r')
            #,
            #'.tar': (tarfile.TarFile, 'r'),
            #'.tar.gz': (tarfile.TarFile, 'r:gz'),
            #'.tgz': (tarfile.TarFile, 'r:gz'),
            #'.tar.bz2': (tarfile.TarFile, 'r:bz2')
        }
    
        # 遍历文件夹
        for root, dirs, files in os.walk(Path(input_dir)):
            for filename in files:
                file_path = Path(root) / filename
                
                # 检查文件扩展名
                ext = ''.join(Path(filename).suffixes[-2:])  # 处理双扩展名（如 .tar.gz）
                if ext not in supported_formats:
                    continue
    
                # 创建解压目录
                if output_dir:
                    extract_path = Path(output_dir) / file_path.stem
                else:
                    extract_path = file_path.parent / file_path.stem
                #extract_path.mkdir(parents=True, exist_ok=True)
    
                # 执行解压操作
                try:
                    archive_class, mode = supported_formats[ext]
                    with archive_class(file_path, mode) as archive:
                        if ext == '.zip':
                            archive.extractall(extract_path)
                        if ext == '.log.zip':
                            archive.extractall(extract_path)
                        #else:
                        #    archive.extractall(extract_path)#, filter='data')  # 安全过滤
                    print(f"成功解压: {file_path} -> {extract_path}")
    
                    # 删除原文件（如果需要）
                    if delete_after:
                        file_path.unlink()
                        print(f"已删除原文件: {file_path}")
    
                    # 递归解压（如果需要）
                    if recursive:
                        extract_archives(extract_path, output_dir, recursive, delete_after)
    
                except Exception as e:
                    #print(f"解压失败 [{file_path}]: {str(e)}")
                    continue
    
def get_user_input():
    """获取用户输入"""
    print("\n=== 日志处理工具 ===")
    
    # 获取输入目录
    while True:
        input_dir = input("\n请输入日志文件所在目录路径: ").strip()
        if input_dir:
            break
        print("输入不能为空，请重新输入")
    
    # 获取输出目录
    while True:
        output_dir = input("\n请输入输出目录路径: ").strip()
        if output_dir:
            break
        print("输入不能为空，请重新输入")
    
    # 获取关键词
    keywords = None
    use_keywords = input("\n是否按关键词筛选? (y/n): ").strip().lower()
    if use_keywords == 'y':
        keywords_input = input("请输入关键词(多个关键词用空格分隔): ").strip()
        keywords = keywords_input.split() if keywords_input else None
    
    # 获取日志级别
    log_level = None
    use_log_level = input("\n是否按日志级别筛选? (y/n): ").strip().lower()
    if use_log_level == 'y':
        log_level = input("请输入日志级别 (如: INFO, ERROR, WARNING): ").strip().upper()
    
    # 获取文件匹配模式
    file_pattern = input("\n请输入文件匹配模式 (默认: *.log): ").strip()
    file_pattern = file_pattern if file_pattern else "*.log"
    
    return {
        'input_dir': input_dir,
        'output_dir': output_dir,
        'keywords': keywords,
        'log_level': log_level,
        'file_pattern': file_pattern
    }

def main():
    # 获取用户输入
    params = get_user_input()
    
    # 创建处理器并处理日志
    processor = LogProcessor(params['input_dir'], params['output_dir'])
    processor.process_logs(
        keywords=params['keywords'],
        log_level=params['log_level'],
        file_pattern=params['file_pattern']
    )
    
    print("\n处理完成！")

if __name__ == "__main__":
    main() 