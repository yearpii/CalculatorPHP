document.addEventListener('DOMContentLoaded', function () {
    var confirmForms = document.querySelectorAll('form[data-confirm]');
    var num1Input = document.getElementById('num1');
    var num2Input = document.getElementById('num2');
    var operatorInput = document.getElementById('operator-input');
    var operatorButtons = document.querySelectorAll('.op-btn');
    var keyButtons = document.querySelectorAll('.key[data-value]');
    var actionButtons = document.querySelectorAll('.key[data-action]');
    var functionButtons = document.querySelectorAll('.key[data-func]');
    var calcTabs = document.querySelectorAll('.calc-tab');
    var scientificSections = document.querySelectorAll('.scientific-only');
    var calculatorPanel = document.querySelector('.calculator-panel');
    var historyTabs = document.querySelectorAll('.history-tab');
    var historyContents = document.querySelectorAll('.history-content');
    var activeInput = num1Input;
    var currentMode = 'scientific';

    if (num1Input && num2Input) {
        num1Input.addEventListener('focus', function () {
            activeInput = num1Input;
        });

        num2Input.addEventListener('focus', function () {
            activeInput = num2Input;
        });

        if (num2Input.value !== '') {
            activeInput = num2Input;
        }
    }

    operatorButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            var selectedOperator = button.getAttribute('data-operator') || '+';
            operatorInput.value = selectedOperator;
            operatorButtons.forEach(function (btn) {
                btn.classList.remove('active');
            });
            button.classList.add('active');
        });
    });

    keyButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            if (!activeInput) {
                return;
            }

            var value = button.getAttribute('data-value') || '';
            if (value === '.' && activeInput.value.indexOf('.') !== -1) {
                return;
            }

            activeInput.value += value;
            activeInput.dispatchEvent(new Event('input', { bubbles: true }));
            activeInput.focus();
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

            if (!activeInput || activeInput.value.trim() === '') {
                return;
            }

            var fn = button.getAttribute('data-func');
            var source = Number(activeInput.value);
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
            }

            activeInput.value = String(Number(result.toFixed(10)));
            activeInput.dispatchEvent(new Event('input', { bubbles: true }));
        });
    });

    actionButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            if (!num1Input || !num2Input) {
                return;
            }

            var action = button.getAttribute('data-action');
            if (action === 'backspace' && activeInput) {
                activeInput.value = activeInput.value.slice(0, -1);
            }

            if (action === 'clear-input' && activeInput) {
                activeInput.value = '';
            }

            if (action === 'clear-all') {
                num1Input.value = '';
                num2Input.value = '';
            }

            if (action === 'swap') {
                var temp = num1Input.value;
                num1Input.value = num2Input.value;
                num2Input.value = temp;
            }

            if (action === 'percent' && activeInput) {
                var percentValue = Number(activeInput.value);
                if (!Number.isNaN(percentValue)) {
                    activeInput.value = String(Number((percentValue / 100).toFixed(10)));
                }
            }
        });
    });

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
        if (!activeInput) {
            return;
        }

        if (event.key >= '0' && event.key <= '9') {
            activeInput.focus();
        }
    });
});
