document.addEventListener('DOMContentLoaded', function () {
    var confirmForms = document.querySelectorAll('form[data-confirm]');
    var num1Input = document.getElementById('num1');
    var num2Input = document.getElementById('num2');
    var operatorInput = document.getElementById('operator-input');
    var expressionInput = document.getElementById('expression-input');
    var expressionResultInput = document.getElementById('expression-result-input');
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
    var modeStorageKey = 'calculator-mode';

    // Calculator state
    var displayValue = '0';
    var storedValue = null;
    var currentOperator = null;
    var shouldClearDisplay = false;

    function updateDisplay() {
        if (displayOutput) {
            displayOutput.textContent = displayValue;
        }
        updateExpression();
    }

    function updateExpression() {
        if (displayExpression) {
            if (/[()a-zA-Z]/.test(displayValue)) {
                displayExpression.textContent = displayValue;
            } else if (storedValue !== null && currentOperator !== null) {
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

    function parseDisplayNumber(raw) {
        var normalized = String(raw).trim();
        if (normalized === '' || normalized === '-' || normalized === '.') {
            return Number.NaN;
        }
        return Number(normalized);
    }

    function isExpressionModeValue(value) {
        return /[()a-zA-Z]/.test(value);
    }

    function evaluateExpression(rawExpression) {
        var compact = String(rawExpression).replace(/\s+/g, '');
        if (compact === '') {
            return null;
        }
        if (!/^[0-9+\-*/^().a-zA-Z]+$/.test(compact)) {
            return null;
        }

        var normalized = compact
            .replace(/sqrt\(/gi, 'Math.sqrt(')
            .replace(/(\d|\))\(/g, '$1*(')
            .replace(/(\d|\))Math\.sqrt\(/g, '$1*Math.sqrt(')
            .replace(/\)(\d)/g, ')*$1')
            .replace(/\^/g, '**');

        try {
            var computed = Function('"use strict"; return (' + normalized + ');')();
            if (typeof computed !== 'number' || !Number.isFinite(computed)) {
                return null;
            }
            return Number(computed.toFixed(10));
        } catch (error) {
            return null;
        }
    }

    function calculateBinary(num1, num2, operator) {
        if (operator === '+') return num1 + num2;
        if (operator === '-') return num1 - num2;
        if (operator === '*') return num1 * num2;
        if (operator === '/') {
            if (num2 === 0) return null;
            return num1 / num2;
        }
        if (operator === '^') {
            var powerResult = Math.pow(num1, num2);
            if (!Number.isFinite(powerResult)) return null;
            return powerResult;
        }
        return null;
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

    function countChar(source, char) {
        var total = 0;
        for (var i = 0; i < source.length; i += 1) {
            if (source.charAt(i) === char) {
                total += 1;
            }
        }
        return total;
    }

    function appendFunctionTemplate(template) {
        if (shouldClearDisplay) {
            displayValue = '0';
            shouldClearDisplay = false;
        }

        if (displayValue === '0') {
            displayValue = template;
        } else if (/[0-9)]$/.test(displayValue)) {
            displayValue += '*' + template;
        } else {
            displayValue += template;
        }
        updateDisplay();
    }

    operatorButtons.forEach(function (button) {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            var selectedOperator = button.getAttribute('data-operator') || '+';
            var expressionTyping = isExpressionModeValue(displayValue);

            if (expressionTyping) {
                if (shouldClearDisplay) {
                    displayValue = '0';
                    shouldClearDisplay = false;
                }
                if (displayValue === '0' && selectedOperator === '-') {
                    displayValue = '-';
                } else if (displayValue !== '0') {
                    displayValue += selectedOperator;
                }
                operatorButtons.forEach(function (btn) {
                    btn.classList.remove('active');
                });
                currentOperator = null;
                storedValue = null;
                updateExpression();
                updateDisplay();
                return;
            }
            
            // If we have a stored value and current display value, calculate the result
            if (storedValue !== null && currentOperator !== null && !shouldClearDisplay) {
                var num1 = parseDisplayNumber(storedValue);
                var num2 = parseDisplayNumber(displayValue);
                var result = calculateBinary(num1, num2, currentOperator);
                if (Number.isNaN(num1) || Number.isNaN(num2) || result === null) {
                    setDisplayValue('Error');
                    return;
                }

                var roundedResult = Number(result.toFixed(10));
                setDisplayValue(roundedResult);
                storedValue = String(roundedResult);
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

        try {
            window.localStorage.setItem(modeStorageKey, currentMode);
        } catch (error) {
            // Abaikan jika localStorage tidak tersedia.
        }
    }

    calcTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            setCalcMode(tab.getAttribute('data-mode') || 'scientific');
        });
    });

    var initialMode = 'scientific';
    try {
        var savedMode = window.localStorage.getItem(modeStorageKey);
        if (savedMode === 'standard' || savedMode === 'scientific') {
            initialMode = savedMode;
        }
    } catch (error) {
        // Abaikan jika localStorage tidak tersedia.
    }
    setCalcMode(initialMode);

    functionButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            if (currentMode !== 'scientific') {
                return;
            }

            var fn = button.getAttribute('data-func');
            if (fn === 'reciprocal') {
                appendFunctionTemplate('1/(');
                return;
            }
            if (fn === 'sqrt') {
                appendFunctionTemplate('sqrt(');
                return;
            }

            if (displayValue.trim() === '' || displayValue === '0') {
                return;
            }

            var source = parseDisplayNumber(displayValue);
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
                var percentValue = parseDisplayNumber(displayValue);
                if (!Number.isNaN(percentValue)) {
                    setDisplayValue(Number((percentValue / 100).toFixed(10)));
                }
            }

            if (action === 'open-paren') {
                if (shouldClearDisplay) {
                    displayValue = '0';
                    shouldClearDisplay = false;
                }
                if (displayValue === '0') {
                    displayValue = '(';
                } else {
                    displayValue += '(';
                }
                updateDisplay();
            }

            if (action === 'close-paren') {
                var openCount = countChar(displayValue, '(');
                var closeCount = countChar(displayValue, ')');
                if (openCount > closeCount) {
                    displayValue += ')';
                    updateDisplay();
                }
            }
        });
    });

    // Handle form submission (equals button)
    if (calcForm) {
        calcForm.addEventListener('submit', function (e) {
            if (expressionInput) {
                expressionInput.value = '';
            }
            if (expressionResultInput) {
                expressionResultInput.value = '';
            }

            if (isExpressionModeValue(displayValue)) {
                var originalExpression = displayValue;
                var evaluated = evaluateExpression(originalExpression);
                if (evaluated === null) {
                    e.preventDefault();
                    setDisplayValue('Error');
                    return;
                }

                setDisplayValue(evaluated);
                if (expressionInput) {
                    expressionInput.value = originalExpression;
                }
                if (expressionResultInput) {
                    expressionResultInput.value = String(evaluated);
                }
                num1Input.value = '';
                num2Input.value = '';
                operatorInput.value = '';
                storedValue = null;
                currentOperator = null;
                shouldClearDisplay = false;
                operatorButtons.forEach(function (btn) {
                    btn.classList.remove('active');
                });
                updateExpression();
                return;
            }

            if (storedValue !== null && currentOperator !== null) {
                var submitNum1 = parseDisplayNumber(storedValue);
                var submitNum2 = parseDisplayNumber(displayValue);
                if (Number.isNaN(submitNum1) || Number.isNaN(submitNum2)) {
                    e.preventDefault();
                    setDisplayValue('Error');
                    return;
                }

                num1Input.value = String(submitNum1);
                num2Input.value = String(submitNum2);
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
        } else if (event.key === '(') {
            event.preventDefault();
            var openParenBtn = document.querySelector('.key[data-action="open-paren"]');
            if (openParenBtn) openParenBtn.click();
        } else if (event.key === ')') {
            event.preventDefault();
            var closeParenBtn = document.querySelector('.key[data-action="close-paren"]');
            if (closeParenBtn) closeParenBtn.click();
        } else if (event.key === '+' || event.key === '-' || event.key === '*' || event.key === '/' || event.key === '^') {
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
