document.addEventListener('DOMContentLoaded', function () {
    var confirmForms = document.querySelectorAll('form[data-confirm]');
    var num1Input = document.getElementById('num1');
    var num2Input = document.getElementById('num2');
    var operatorInput = document.getElementById('operator-input');
    var displayOutput = document.getElementById('display-output');
    var displayExpression = document.getElementById('display-expression');
    var calcForm = document.getElementById('calc-form');
    var operatorButtons = document.querySelectorAll('.op-btn');
    var keyButtons = document.querySelectorAll('.key[data-value]');
    var actionButtons = document.querySelectorAll('.key[data-action]');
    var functionButtons = document.querySelectorAll('.key[data-func]');
    var calcTabs = document.querySelectorAll('.calc-tab');
    var scientificSections = document.querySelectorAll('.scientific-only');
    var calculatorPanel = document.querySelector('.calculator-panel');
    var historyTabs = document.querySelectorAll('.history-tab');
    var historyContents = document.querySelectorAll('.history-content');
    var currentMode = 'scientific';

    // Calculator state
    var displayValue = '0';
    var storedValue = null;
    var currentOperator = null;
    var shouldClearDisplay = false;

    function updateDisplay() {
        if (displayOutput) {
            displayOutput.textContent = displayValue;
        }
    }

    function updateExpression() {
        if (displayExpression) {
            if (storedValue !== null && currentOperator !== null) {
                displayExpression.textContent = storedValue + ' ' + currentOperator;
            } else {
                displayExpression.textContent = '';
            }
        }
    }

    function setDisplayValue(value) {
        displayValue = String(value);
        updateDisplay();
    }

    function appendToDisplay(value) {
        if (displayValue === '0' && value !== '.') {
            displayValue = value;
        } else if (value === '.' && displayValue.indexOf('.') === -1) {
            displayValue += value;
        } else if (value !== '.') {
            displayValue += value;
        }
        updateDisplay();
    }

    operatorButtons.forEach(function (button) {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            var selectedOperator = button.getAttribute('data-operator') || '+';
            
            // If we have a stored value and current display value, calculate the result
            if (storedValue !== null && currentOperator !== null && !shouldClearDisplay) {
                var num1 = Number(storedValue);
                var num2 = Number(displayValue);
                var result = num1;
                
                if (currentOperator === '+') result = num1 + num2;
                else if (currentOperator === '-') result = num1 - num2;
                else if (currentOperator === '*') result = num1 * num2;
                else if (currentOperator === '/') {
                    if (num2 === 0) {
                        setDisplayValue('Error');
                        return;
                    }
                    result = num1 / num2;
                }
                
                setDisplayValue(result);
                storedValue = String(result);
            } else {
                storedValue = displayValue;
            }
            
            currentOperator = selectedOperator;
            shouldClearDisplay = true;
            updateExpression();
            
            // Update active operator button
            operatorButtons.forEach(function (btn) {
                btn.classList.remove('active');
            });
            button.classList.add('active');
        });
    });

    keyButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            var value = button.getAttribute('data-value') || '';
            
            if (shouldClearDisplay) {
                displayValue = '0';
                shouldClearDisplay = false;
            }
            
            if (value === '.' && displayValue.indexOf('.') !== -1) {
                return;
            }
            
            appendToDisplay(value);
        });
    });

    function setCalcMode(mode) {
        var nextMode = mode === 'standard' ? 'standard' : 'scientific';
        var isModeChanged = currentMode !== nextMode;
        currentMode = nextMode;

        calcTabs.forEach(function (tab) {
            tab.classList.toggle('active', tab.getAttribute('data-mode') === currentMode);
        });
        scientificSections.forEach(function (section) {
            section.classList.toggle('is-hidden', currentMode === 'standard');
        });

        if (isModeChanged && calculatorPanel) {
            calculatorPanel.classList.remove('mode-switching');
            void calculatorPanel.offsetWidth;
            calculatorPanel.classList.add('mode-switching');
        }
    }

    calcTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            setCalcMode(tab.getAttribute('data-mode') || 'scientific');
        });
    });

    setCalcMode('scientific');

    functionButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            if (currentMode !== 'scientific') {
                return;
            }

            if (displayValue.trim() === '' || displayValue === '0') {
                return;
            }

            var fn = button.getAttribute('data-func');
            var source = Number(displayValue);
            if (Number.isNaN(source)) {
                return;
            }

            var result = source;
            if (fn === 'sin') {
                result = Math.sin(source);
            } else if (fn === 'cos') {
                result = Math.cos(source);
            } else if (fn === 'tan') {
                result = Math.tan(source);
            } else if (fn === 'log') {
                if (source <= 0) {
                    return;
                }
                result = Math.log10(source);
            } else if (fn === 'reciprocal') {
                if (source === 0) {
                    setDisplayValue('Error');
                    return;
                }
                result = 1 / source;
            } else if (fn === 'square') {
                result = source * source;
            } else if (fn === 'cbrt') {
                result = Math.cbrt(source);
            }

            setDisplayValue(Number(result.toFixed(10)));
        });
    });

    actionButtons.forEach(function (button) {
        button.addEventListener('click', function (e) {
            var action = button.getAttribute('data-action');
            
            if (action === 'backspace') {
                displayValue = displayValue.slice(0, -1) || '0';
                updateDisplay();
            }

            if (action === 'clear-input') {
                displayValue = '0';
                updateDisplay();
            }

            if (action === 'clear-all') {
                displayValue = '0';
                storedValue = null;
                currentOperator = null;
                shouldClearDisplay = false;
                operatorButtons.forEach(function (btn) {
                    btn.classList.remove('active');
                });
                updateDisplay();
                updateExpression();
            }

            if (action === 'percent') {
                var percentValue = Number(displayValue);
                if (!Number.isNaN(percentValue)) {
                    setDisplayValue(Number((percentValue / 100).toFixed(10)));
                }
            }
        });
    });

    // Handle form submission (equals button)
    if (calcForm) {
        calcForm.addEventListener('submit', function (e) {
            if (storedValue !== null && currentOperator !== null) {
                num1Input.value = storedValue;
                num2Input.value = displayValue;
                operatorInput.value = currentOperator;
                
                // Reset calculator state
                storedValue = null;
                currentOperator = null;
                shouldClearDisplay = false;
                operatorButtons.forEach(function (btn) {
                    btn.classList.remove('active');
                });
                updateExpression();
            }
        });
    }

    historyTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            var target = tab.getAttribute('data-target');
            historyTabs.forEach(function (item) {
                item.classList.remove('active');
            });
            tab.classList.add('active');

            historyContents.forEach(function (content) {
                content.classList.remove('active');
                if (content.getAttribute('data-content') === target) {
                    content.classList.add('active');
                }
            });
        });
    });

    confirmForms.forEach(function (form) {
        form.addEventListener('submit', function (event) {
            var message = form.getAttribute('data-confirm') || 'Yakin?';
            var isConfirmed = window.confirm(message);
            if (!isConfirmed) {
                event.preventDefault();
            }
        });
    });

    document.addEventListener('keydown', function (event) {
        if (event.key >= '0' && event.key <= '9') {
            if (shouldClearDisplay) {
                displayValue = '0';
                shouldClearDisplay = false;
            }
            appendToDisplay(event.key);
        } else if (event.key === '.') {
            if (shouldClearDisplay) {
                displayValue = '0';
                shouldClearDisplay = false;
            }
            if (displayValue.indexOf('.') === -1) {
                appendToDisplay('.');
            }
        } else if (event.key === '+' || event.key === '-' || event.key === '*' || event.key === '/') {
            event.preventDefault();
            var btn = document.querySelector('.op-btn[data-operator="' + event.key + '"]');
            if (btn) btn.click();
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (calcForm) calcForm.dispatchEvent(new Event('submit'));
        } else if (event.key === 'Backspace') {
            event.preventDefault();
            displayValue = displayValue.slice(0, -1) || '0';
            updateDisplay();
        }
    });

    // Initialize display
    updateDisplay();
});
