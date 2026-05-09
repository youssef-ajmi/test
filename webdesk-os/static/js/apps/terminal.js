// Terminal App

const TerminalApp = {
    window: null,
    output: '',
    history: [],
    historyIndex: -1,
    
    open() {
        if (this.window) {
            WindowManager.restoreWindow(this.window);
            return;
        }
        
        const content = `
            <div class="terminal-window" style="height: 100%; display: flex; flex-direction: column;">
                <div class="terminal-output" id="terminal-output"></div>
                <div class="terminal-input-line">
                    <span class="terminal-prompt">user@webdesk:~$</span>
                    <input type="text" class="terminal-input" id="terminal-input" autocomplete="off" spellcheck="false">
                </div>
            </div>
        `;
        
        this.window = WindowManager.createWindow('Terminal', content, {
            width: 700,
            height: 500
        });
        
        this.setupTerminal();
    },
    
    setupTerminal() {
        const input = document.getElementById('terminal-input');
        const output = document.getElementById('terminal-output');
        
        if (!input || !output) return;
        
        this.outputEl = output;
        
        // Welcome message
        output.innerHTML = '<div style="color: #888;">WebDesk OS Terminal v1.0<br>Type "help" for available commands<br><br></div>';
        
        input.addEventListener('keydown', (e) => {
            if (e.code === 'Enter') {
                const command = input.value.trim();
                if (command) {
                    this.history.push(command);
                    this.historyIndex = this.history.length;
                    this.executeCommand(command);
                }
                input.value = '';
            } else if (e.code === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    input.value = this.history[this.historyIndex];
                }
            } else if (e.code === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    input.value = this.history[this.historyIndex];
                } else {
                    this.historyIndex = this.history.length;
                    input.value = '';
                }
            }
        });
        
        // Keep focus on input
        output.addEventListener('click', () => input.focus());
        input.focus();
    },
    
    executeCommand(command) {
        // Display command
        this.outputEl.innerHTML += `<div style="color: var(--text-primary);"><span class="terminal-prompt">user@webdesk:~$</span> ${command}</div>`;
        
        // Built-in commands
        const builtInCommands = {
            help: () => 'Available commands:\n  help     - Show this help\n  clear    - Clear terminal\n  date     - Show current date/time\n  whoami   - Show current user\n  pwd      - Print working directory\n  ls       - List files\n  echo     - Print text\n  calc     - Simple calculator (e.g., calc 2+2)',
            clear: () => { this.outputEl.innerHTML = ''; return ''; },
            date: () => new Date().toString(),
            whoami: () => 'user',
            pwd: () => '~',
            ls: () => 'Desktop  Documents  Downloads  Music  Pictures  Videos',
            echo: (args) => args.join(' '),
            calc: (args) => {
                try {
                    return eval(args.join(''));
                } catch {
                    return 'Invalid expression';
                }
            }
        };
        
        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        if (builtInCommands[cmd]) {
            const result = builtInCommands[cmd](args);
            if (result) {
                this.outputEl.innerHTML += `<div style="color: var(--text-secondary); margin: 5px 0;">${result.replace(/\n/g, '<br>')}</div>`;
            }
        } else {
            // Send to backend for execution
            if (App.socket) {
                App.socket.emit('execute_command', { command });
            } else {
                this.outputEl.innerHTML += `<div style="color: #ff5f57;">Command not found: ${cmd}</div>`;
            }
        }
        
        // Scroll to bottom
        this.outputEl.scrollTop = this.outputEl.scrollHeight;
    },
    
    handleCommandResult(data) {
        if (this.outputEl) {
            const color = data.exit_code === 0 ? 'var(--text-secondary)' : '#ff5f57';
            this.outputEl.innerHTML += `<div style="color: ${color}; white-space: pre-wrap; margin: 5px 0;">${data.output}</div>`;
            this.outputEl.scrollTop = this.outputEl.scrollHeight;
        }
    },
    
    close() {
        if (this.window) {
            WindowManager.closeWindow(this.window);
            this.window = null;
        }
    }
};

window.TerminalApp = TerminalApp;
