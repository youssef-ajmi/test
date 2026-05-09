"""
WebDesk OS - macOS-style Desktop as Lively Wallpaper
Flask Application Entry Point
"""

import os
import json
import subprocess
import threading
from datetime import datetime
from flask import Flask, render_template, jsonify, request, send_from_directory
from flask_socketio import SocketIO, emit
import psutil
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'webdesk-os-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*")

# Configuration
CONFIG_FILE = os.path.join(os.path.dirname(__file__), 'config.json')
DEFAULT_CONFIG = {
    "theme": "dark",
    "dock_position": "bottom",
    "dock_size": "medium",
    "icon_size": "medium",
    "clock_format": "12h",
    "wallpaper": "default",
    "pinned_apps": ["finder", "terminal", "notes", "calculator"],
    "recent_apps": []
}

# Global variables
file_observer = None
desktop_path = os.path.expanduser("~/Desktop")
if not os.path.exists(desktop_path):
    desktop_path = os.path.expanduser("~")

# Load or create config
def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r') as f:
            config = json.load(f)
            # Merge with defaults for any missing keys
            for key, value in DEFAULT_CONFIG.items():
                if key not in config:
                    config[key] = value
            return config
    else:
        save_config(DEFAULT_CONFIG)
        return DEFAULT_CONFIG

def save_config(config):
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)

# File system event handler
class DesktopFileHandler(FileSystemEventHandler):
    def __init__(self, socket):
        self.socket = socket
    
    def on_any_event(self, event):
        if not event.is_directory:
            self.socket.emit('desktop_changed', {'event': event.event_type, 'path': event.src_path})

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

@app.route('/api/desktop/files')
def get_desktop_files():
    """Get list of files on the real desktop"""
    try:
        files = []
        for item in os.listdir(desktop_path):
            item_path = os.path.join(desktop_path, item)
            is_dir = os.path.isdir(item_path)
            stat_info = os.stat(item_path)
            files.append({
                'name': item,
                'path': item_path,
                'is_directory': is_dir,
                'size': stat_info.st_size if not is_dir else 0,
                'modified': datetime.fromtimestamp(stat_info.st_mtime).isoformat(),
                'extension': os.path.splitext(item)[1].lower() if not is_dir else ''
            })
        return jsonify({'success': True, 'files': files})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/files/open', methods=['POST'])
def open_file():
    """Open a file with its default application"""
    data = request.json
    file_path = data.get('path')
    
    if not file_path or not os.path.exists(file_path):
        return jsonify({'success': False, 'error': 'File not found'})
    
    try:
        # Validate path to prevent directory traversal
        abs_path = os.path.abspath(file_path)
        if os.name == 'nt':  # Windows
            os.startfile(abs_path)
        else:  # macOS/Linux
            subprocess.run(['open' if os.name == 'posix' else 'xdg-open', abs_path])
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/files/delete', methods=['POST'])
def delete_file():
    """Delete a file or folder"""
    data = request.json
    file_path = data.get('path')
    
    if not file_path or not os.path.exists(file_path):
        return jsonify({'success': False, 'error': 'File not found'})
    
    try:
        abs_path = os.path.abspath(file_path)
        if os.path.isdir(abs_path):
            os.rmdir(abs_path)  # Only empty directories
        else:
            os.remove(abs_path)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/files/rename', methods=['POST'])
def rename_file():
    """Rename a file or folder"""
    data = request.json
    old_path = data.get('old_path')
    new_name = data.get('new_name')
    
    if not old_path or not os.path.exists(old_path):
        return jsonify({'success': False, 'error': 'File not found'})
    
    if not new_name:
        return jsonify({'success': False, 'error': 'New name required'})
    
    try:
        abs_old = os.path.abspath(old_path)
        parent_dir = os.path.dirname(abs_old)
        abs_new = os.path.join(parent_dir, new_name)
        os.rename(abs_old, abs_new)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/apps/list')
def list_apps():
    """List installed applications (Windows Start Menu shortcuts)"""
    apps = []
    
    if os.name == 'nt':
        # Windows Start Menu locations
        start_menu_paths = [
            os.path.expandvars(r'%APPDATA%\Microsoft\Windows\Start Menu\Programs'),
            os.path.expandvars(r'%PROGRAMDATA%\Microsoft\Windows\Start Menu\Programs')
        ]
        
        for start_path in start_menu_paths:
            if os.path.exists(start_path):
                for root, dirs, files in os.walk(start_path):
                    for file in files:
                        if file.endswith('.lnk'):
                            full_path = os.path.join(root, file)
                            apps.append({
                                'name': os.path.splitext(file)[0],
                                'path': full_path,
                                'type': 'shortcut'
                            })
    
    return jsonify({'success': True, 'apps': apps[:50]})  # Limit to 50 apps

@app.route('/api/apps/launch', methods=['POST'])
def launch_app():
    """Launch an application"""
    data = request.json
    app_path = data.get('path')
    
    if not app_path:
        return jsonify({'success': False, 'error': 'No app path provided'})
    
    try:
        if os.name == 'nt':
            os.startfile(app_path)
        else:
            subprocess.Popen([app_path])
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/system/info')
def get_system_info():
    """Get current system information"""
    battery = psutil.sensors_battery()
    return jsonify({
        'cpu_percent': psutil.cpu_percent(interval=0.1),
        'memory_percent': psutil.virtual_memory().percent,
        'disk_usage': psutil.disk_usage('/').percent if os.name != 'nt' else psutil.disk_usage('C:\\').percent,
        'battery': {
            'percent': battery.percent if battery else None,
            'plugged': battery.power_plugged if battery else None
        } if battery else None,
        'time': datetime.now().strftime('%H:%M:%S'),
        'date': datetime.now().strftime('%Y-%m-%d')
    })

@app.route('/api/config', methods=['GET'])
def get_config_endpoint():
    """Get current configuration"""
    return jsonify(load_config())

@app.route('/api/config', methods=['POST'])
def save_config_endpoint():
    """Save configuration"""
    config = request.json
    save_config(config)
    return jsonify({'success': True})

# WebSocket events
@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('connected', {'message': 'Connected to WebDesk OS'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('request_desktop_refresh')
def handle_desktop_refresh():
    """Force refresh desktop files"""
    emit('desktop_changed', {'event': 'refresh'})

@socketio.on('execute_command')
def handle_command(data):
    """Execute terminal command"""
    command = data.get('command')
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )
        output = result.stdout if result.stdout else result.stderr
        if not output:
            output = f"Command executed (exit code: {result.returncode})"
        emit('command_result', {'output': output, 'exit_code': result.returncode})
    except subprocess.TimeoutExpired:
        emit('command_result', {'output': 'Command timed out', 'exit_code': -1})
    except Exception as e:
        emit('command_result', {'output': str(e), 'exit_code': -1})

def start_file_watcher():
    """Start watching desktop for changes"""
    global file_observer
    event_handler = DesktopFileHandler(socketio)
    file_observer = Observer()
    file_observer.schedule(event_handler, desktop_path, recursive=False)
    file_observer.start()

if __name__ == '__main__':
    # Start file watcher
    start_file_watcher()
    
    # Load config
    config = load_config()
    
    print("=" * 50)
    print("🖥️  WebDesk OS Starting...")
    print("=" * 50)
    print(f"📁 Desktop Path: {desktop_path}")
    print(f"🎨 Theme: {config['theme']}")
    print(f"🔗 Access URL: http://127.0.0.1:5000")
    print("=" * 50)
    print("Configure Lively Wallpaper to use: http://127.0.0.1:5000")
    print("=" * 50)
    
    # Run Flask app (localhost only for security)
    socketio.run(app, host='127.0.0.1', port=5000, debug=True, allow_unsafe_werkzeug=True)
