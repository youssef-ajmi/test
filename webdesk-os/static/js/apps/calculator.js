// Calculator App

const CalculatorApp = {
    window: null,
    display: '0',
    previousValue: null,
    operation: null,
    waitingForOperand: false,
    
    open() {
        if (this.window) {
            WindowManager.restoreWindow(this.window);
            return;
        }
        
        const content = `
            <div class="calculator">
                <div class="calc-display" id="calc-display">0</div>
                <button class="calc-btn clear" onclick="CalculatorApp.clear()">AC</button>
                <button class="calc-btn" onclick="CalculatorApp.toggleSign()">±</button>
                <button class="calc-btn" onclick="CalculatorApp.percent()">%</button>
                <button class="calc-btn operator" onclick="CalculatorApp.setOperation('/')">÷</button>
                <button class="calc-btn" onclick="CalculatorApp.inputDigit('7')">7</button>
                <button class="calc-btn" onclick="CalculatorApp.inputDigit('8')">8</button>
                <button class="calc-btn" onclick="CalculatorApp.inputDigit('9')">9</button>
                <button class="calc-btn operator" onclick="CalculatorApp.setOperation('*')">×</button>
                <button class="calc-btn" onclick="CalculatorApp.inputDigit('4')">4</button>
                <button class="calc-btn" onclick="CalculatorApp.inputDigit('5')">5</button>
                <button class="calc-btn" onclick="CalculatorApp.inputDigit('6')">6</button>
                <button class="calc-btn operator" onclick="CalculatorApp.setOperation('-')">−</button>
                <button class="calc-btn" onclick="CalculatorApp.inputDigit('1')">1</button>
                <button class="calc-btn" onclick="CalculatorApp.inputDigit('2')">2</button>
                <button class="calc-btn" onclick="CalculatorApp.inputDigit('3')">3</button>
                <button class="calc-btn operator" onclick="CalculatorApp.setOperation('+')">+</button>
                <button class="calc-btn" onclick="CalculatorApp.inputDigit('0')" style="grid-column: span 2;">0</button>
                <button class="calc-btn" onclick="CalculatorApp.inputDigit('.')">.</button>
                <button class="calc-btn equals" onclick="CalculatorApp.calculate()">=</button>
            </div>
        `;
        
        this.window = WindowManager.createWindow('Calculator', content, {
            width: 320,
            height: 420
        });
    },
    
    updateDisplay() {
        const display = document.getElementById('calc-display');
        if (display) {
            // Format number with commas
            let formatted = this.display;
            if (!formatted.includes('e') && !formatted.includes('.')) {
                formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }
            display.textContent = formatted;
        }
    },
    
    inputDigit(digit) {
        if (this.waitingForOperand) {
            this.display = digit;
            this.waitingForOperand = false;
        } else {
            this.display = this.display === '0' ? digit : this.display + digit;
        }
        this.updateDisplay();
    },
    
    clear() {
        this.display = '0';
        this.previousValue = null;
        this.operation = null;
        this.waitingForOperand = false;
        this.updateDisplay();
    },
    
    toggleSign() {
        this.display = String(-parseFloat(this.display));
        this.updateDisplay();
    },
    
    percent() {
        this.display = String(parseFloat(this.display) / 100);
        this.updateDisplay();
    },
    
    setOperation(op) {
        const inputValue = parseFloat(this.display);
        
        if (this.previousValue === null) {
            this.previousValue = inputValue;
        } else if (this.operation && !this.waitingForOperand) {
            const result = this.performOperation(this.operation, this.previousValue, inputValue);
            this.previousValue = result;
            this.display = String(result);
            this.updateDisplay();
        }
        
        this.waitingForOperand = true;
        this.operation = op;
    },
    
    performOperation(op, a, b) {
        switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return a / b;
            default: return b;
        }
    },
    
    calculate() {
        if (!this.operation || this.previousValue === null) return;
        
        const inputValue = parseFloat(this.display);
        const result = this.performOperation(this.operation, this.previousValue, inputValue);
        
        this.display = String(result);
        this.previousValue = null;
        this.operation = null;
        this.waitingForOperand = false;
        this.updateDisplay();
    },
    
    close() {
        if (this.window) {
            WindowManager.closeWindow(this.window);
            this.window = null;
        }
    }
};

window.CalculatorApp = CalculatorApp;
