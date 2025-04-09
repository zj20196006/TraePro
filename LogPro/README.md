# 日志处理工具

这是一个用于筛选和处理日志文件的Python工具。它可以根据多种条件（时间范围、关键词、日志级别等）来筛选日志，并将结果保存到指定目录。

## 功能特点

- 支持按时间范围筛选
- 支持关键词筛选
- 支持日志级别筛选
- 支持批量处理多个日志文件
- 显示处理进度
- 错误处理和日志记录

## 安装依赖

```bash
pip install -r requirements.txt
```

## 使用方法

基本用法：

```bash
python log_processor.py --input <输入目录> --output <输出目录>
```

完整参数：

```bash
python log_processor.py \
    --input <输入目录> \
    --output <输出目录> \
    --start-time "2023-01-01 00:00:00" \
    --end-time "2023-01-01 23:59:59" \
    --keywords "error" "warning" \
    --log-level "ERROR" \
    --file-pattern "*.log"
```

参数说明：
- `--input`: 输入日志文件所在的目录（必需）
- `--output`: 输出目录（必需）
- `--start-time`: 开始时间（格式：YYYY-MM-DD HH:MM:SS）
- `--end-time`: 结束时间（格式：YYYY-MM-DD HH:MM:SS）
- `--keywords`: 关键词列表（可以指定多个）
- `--log-level`: 日志级别（如：INFO, ERROR, WARNING）
- `--file-pattern`: 文件匹配模式（默认：*.log）

## 输出结果

处理后的日志文件将保存在输出目录中，文件名格式为 `filtered_原文件名`。

## 注意事项

1. 时间提取逻辑需要根据实际的日志格式进行调整
2. 确保输入目录存在且包含日志文件
3. 输出目录如果不存在会自动创建
4. 处理大文件时可能需要较长时间，请耐心等待 