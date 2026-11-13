<?php
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
session_start();

$dir = __DIR__;
$max = 39;
$weightExtraFor39 = 2;

$seq = range(1, $max);
for ($i = 0; $i < $weightExtraFor39; $i++) {
    $seq[] = 39;
}
$total = count($seq);

if (!isset($_SESSION['bg_idx'])) {
    $_SESSION['bg_idx'] = 0;
} else {
    $_SESSION['bg_idx'] = ($_SESSION['bg_idx'] + 1) % $total;
}

$num = $seq[$_SESSION['bg_idx']];
$file = $dir . DIRECTORY_SEPARATOR . $num . '.html';

if (file_exists($file)) {
    readfile($file);
}
