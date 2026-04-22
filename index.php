<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

$message = '';
$messageType = '';
$result = null;
$num1Value = '';
$num2Value = '';
$operatorValue = '+';

function formatNumber(float $value): string
{
    $formatted = number_format($value, 10, '.', '');
    $trimmed = rtrim(rtrim($formatted, '0'), '.');
    return $trimmed === '' ? '0' : $trimmed;
}

try {
    $pdo->exec('ALTER TABLE riwayat_kalkulator ADD COLUMN archived TINYINT(1) NOT NULL DEFAULT 0');
} catch (PDOException $e) {
    // Kolom sudah ada, aman diabaikan.
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['clear_history'])) {
        $stmt = $pdo->prepare('DELETE FROM riwayat_kalkulator WHERE archived = 0');
        $stmt->execute();
        $message = 'History berhasil dihapus.';
        $messageType = 'success';
    } elseif (isset($_POST['clear_archive'])) {
        $stmt = $pdo->prepare('DELETE FROM riwayat_kalkulator WHERE archived = 1');
        $stmt->execute();
        $message = 'Archive berhasil dihapus.';
        $messageType = 'success';
    } elseif (isset($_POST['archive_id'])) {
        $archiveId = filter_var($_POST['archive_id'], FILTER_VALIDATE_INT);
        if ($archiveId !== false) {
            $stmt = $pdo->prepare('UPDATE riwayat_kalkulator SET archived = 1 WHERE id = ?');
            $stmt->execute([$archiveId]);
            $message = 'Data dipindahkan ke Archive.';
            $messageType = 'success';
        }
    } elseif (isset($_POST['restore_id'])) {
        $restoreId = filter_var($_POST['restore_id'], FILTER_VALIDATE_INT);
        if ($restoreId !== false) {
            $stmt = $pdo->prepare('UPDATE riwayat_kalkulator SET archived = 0 WHERE id = ?');
            $stmt->execute([$restoreId]);
            $message = 'Data dikembalikan ke History.';
            $messageType = 'success';
        }
    } else {
        $num1Raw = trim((string) ($_POST['num1'] ?? ''));
        $num2Raw = trim((string) ($_POST['num2'] ?? ''));
        $num1Value = $num1Raw;
        $num2Value = $num2Raw;

        $num1 = filter_var($num1Raw, FILTER_VALIDATE_FLOAT);
        $num2 = filter_var($num2Raw, FILTER_VALIDATE_FLOAT);
        $operator = (string) ($_POST['operator'] ?? '');
        $operatorValue = $operator;

        if ($num1 === false || $num2 === false) {
            $message = 'Input harus berupa angka yang valid.';
            $messageType = 'error';
        } else {
            switch ($operator) {
                case '+':
                    $result = $num1 + $num2;
                    break;
                case '-':
                    $result = $num1 - $num2;
                    break;
                case '*':
                    $result = $num1 * $num2;
                    break;
                case '/':
                    if ((float) $num2 === 0.0) {
                        $message = 'Pembagian dengan nol tidak diperbolehkan.';
                        $messageType = 'error';
                    } else {
                        $result = $num1 / $num2;
                    }
                    break;
                default:
                    $message = 'Operator tidak valid.';
                    $messageType = 'error';
            }

            if ($result !== null) {
                $stmt = $pdo->prepare(
                    'INSERT INTO riwayat_kalkulator (angka_1, operator, angka_2, hasil) VALUES (?, ?, ?, ?)'
                );
                $stmt->execute([$num1, $operator, $num2, $result]);
                $message = 'Perhitungan berhasil disimpan.';
                $messageType = 'success';
            }
        }
    }
}

$historyStmt = $pdo->query('SELECT * FROM riwayat_kalkulator WHERE archived = 0 ORDER BY id DESC LIMIT 10');
$histories = $historyStmt->fetchAll();
$archiveStmt = $pdo->query('SELECT * FROM riwayat_kalkulator WHERE archived = 1 ORDER BY id DESC LIMIT 10');
$archives = $archiveStmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kalkulator Sederhana</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <div class="shell">
            <section class="panel calculator-panel">
                <div class="top-tabs">
                    <button type="button" class="calc-tab" data-mode="standard">Standard</button>
                    <button type="button" class="calc-tab active" data-mode="scientific">Scientific</button>
                </div>

                <div class="display">
                    <div class="display-expression" id="display-expression"></div>
                    <div class="display-result" id="display-output">0</div>
                </div>

                <form method="post" class="calc-form" id="calc-form">
                    <input type="hidden" name="num1" id="num1" value="">
                    <input type="hidden" name="num2" id="num2" value="">
                    <input type="hidden" name="operator" id="operator-input" value="">

                    <div class="keypad scientific-row scientific-only">
                        <button type="button" class="key muted" data-func="sin">sin</button>
                        <button type="button" class="key muted" data-func="cos">cos</button>
                        <button type="button" class="key muted" data-func="tan">tan</button>
                        <button type="button" class="key muted" data-func="log">log</button>
                        <button type="button" class="key muted" data-func="reciprocal">⅓</button>
                        <button type="button" class="key muted" data-func="square">x²</button>
                        <button type="button" class="key muted" data-func="cbrt">∛x</button>
                    </div>

                    <div class="utility-row">
                        <button type="button" class="key action" data-action="clear-all">C</button>
                        <button type="button" class="key action" data-action="backspace">DEL</button>
                        <button type="button" class="key action" data-action="noop">(</button>
                        <button type="button" class="key action" data-action="noop">)</button>
                        <button type="button" class="key action" data-action="percent">%</button>
                    </div>

                    <div class="keypad">
                        <button type="button" class="key" data-value="7">7</button>
                        <button type="button" class="key" data-value="8">8</button>
                        <button type="button" class="key" data-value="9">9</button>
                        <button type="button" class="key op-btn" data-operator="/">&#247;</button>

                        <button type="button" class="key" data-value="4">4</button>
                        <button type="button" class="key" data-value="5">5</button>
                        <button type="button" class="key" data-value="6">6</button>
                        <button type="button" class="key op-btn" data-operator="*">&times;</button>

                        <button type="button" class="key" data-value="1">1</button>
                        <button type="button" class="key" data-value="2">2</button>
                        <button type="button" class="key" data-value="3">3</button>
                        <button type="button" class="key op-btn" data-operator="-">-</button>

                        <button type="button" class="key" data-value="0">0</button>
                        <button type="button" class="key" data-value=".">.</button>
                        <button type="submit" class="key equal">=</button>
                        <button type="button" class="key op-btn" data-operator="+">+</button>
                    </div>
                </form>

                <?php if ($message !== ''): ?>
                    <div class="message <?= htmlspecialchars($messageType === 'success' ? 'success' : 'error', ENT_QUOTES, 'UTF-8') ?>">
                        <?= htmlspecialchars($message, ENT_QUOTES, 'UTF-8') ?>
                    </div>
                <?php endif; ?>
            </section>

            <aside class="panel history-panel">
                <div class="history-tabs">
                    <button type="button" class="history-tab active" data-target="history">History</button>
                    <button type="button" class="history-tab" data-target="archive">Archive</button>
                </div>

                <div class="history-head">
                    <h2>Riwayat</h2>
                    <div class="history-clear-actions">
                        <form method="post" data-confirm="Yakin ingin menghapus semua data History?">
                            <button class="secondary-btn" type="submit" name="clear_history" value="1">Clear History</button>
                        </form>
                        <form method="post" data-confirm="Yakin ingin menghapus semua data Archive?">
                            <button class="secondary-btn archive-btn" type="submit" name="clear_archive" value="1">Clear Archive</button>
                        </form>
                    </div>
                </div>

                <div class="history-list history-content active" data-content="history">
                    <?php if (!$histories): ?>
                        <p class="empty-history">Belum ada data.</p>
                    <?php else: ?>
                        <?php foreach ($histories as $row): ?>
                            <article class="history-item">
                                <p class="expr">
                                    <?= htmlspecialchars(formatNumber((float) $row['angka_1']), ENT_QUOTES, 'UTF-8') ?>
                                    <?= htmlspecialchars((string) $row['operator'], ENT_QUOTES, 'UTF-8') ?>
                                    <?= htmlspecialchars(formatNumber((float) $row['angka_2']), ENT_QUOTES, 'UTF-8') ?>
                                </p>
                                <p class="res">= <?= htmlspecialchars(formatNumber((float) $row['hasil']), ENT_QUOTES, 'UTF-8') ?></p>
                                <time><?= htmlspecialchars((string) $row['created_at'], ENT_QUOTES, 'UTF-8') ?></time>
                                <form method="post" class="archive-action">
                                    <input type="hidden" name="archive_id" value="<?= (int) $row['id'] ?>">
                                    <button type="submit" class="secondary-btn archive-move-btn">Tambahkan ke Archive</button>
                                </form>
                            </article>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>

                <div class="history-list history-content" data-content="archive">
                    <?php if (!$archives): ?>
                        <p class="empty-history">Belum ada item archive.</p>
                    <?php else: ?>
                        <?php foreach ($archives as $row): ?>
                            <article class="history-item">
                                <p class="expr">
                                    <?= htmlspecialchars(formatNumber((float) $row['angka_1']), ENT_QUOTES, 'UTF-8') ?>
                                    <?= htmlspecialchars((string) $row['operator'], ENT_QUOTES, 'UTF-8') ?>
                                    <?= htmlspecialchars(formatNumber((float) $row['angka_2']), ENT_QUOTES, 'UTF-8') ?>
                                </p>
                                <p class="res">= <?= htmlspecialchars(formatNumber((float) $row['hasil']), ENT_QUOTES, 'UTF-8') ?></p>
                                <time><?= htmlspecialchars((string) $row['created_at'], ENT_QUOTES, 'UTF-8') ?></time>
                                <form method="post" class="archive-action">
                                    <input type="hidden" name="restore_id" value="<?= (int) $row['id'] ?>">
                                    <button type="submit" class="secondary-btn">Kembalikan ke History</button>
                                </form>
                            </article>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </aside>
        </div>
    </div>
    <script src="script.js"></script>
</body>
</html>
