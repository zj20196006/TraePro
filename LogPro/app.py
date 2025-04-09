from flask import Flask, request, jsonify, send_file
from log_processor import LogProcessor
import os
import tempfile
import shutil
from pathlib import Path

app = Flask(__name__)

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/process', methods=['POST'])
def process_logs():
    try:
        # 创建临时目录
        with tempfile.TemporaryDirectory() as temp_dir:
            input_dir = Path(temp_dir) / 'input'
            output_dir = Path(temp_dir) / 'output'
            input_dir.mkdir()
            output_dir.mkdir()
            
            # 保存上传的文件
            files = request.files.getlist('files')
            for file in files:
                file_path = input_dir / file.filename
                file.save(str(file_path))
            
            # 获取参数
            keywords = request.form.get('keywords', '').split()
            log_level = request.form.get('logLevel')
            
            # 处理日志
            processor = LogProcessor(str(input_dir), str(output_dir))
            processor.process_logs(
                keywords=keywords if keywords else None,
                log_level=log_level if log_level else None
            )
            
            # 创建结果zip文件
            result_zip = Path(temp_dir) / 'result.zip'
            shutil.make_archive(str(result_zip)[:-4], 'zip', str(output_dir))
            
            # 返回结果
            return jsonify({
                'matchedLines': sum(1 for _ in output_dir.rglob('*.log')),
                'processedFiles': len(files),
                'downloadUrl': '/download'
            })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download')
def download():
    return send_file('result.zip', as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True) 