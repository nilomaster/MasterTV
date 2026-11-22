<?php
// Anti-SSRF URL Validator and Safe External HTTP/HTTPS Fetcher for M3U Imports
// Strictly ASCII comments only

function sanitizeUrlForLog($url) {
    $parts = @parse_url((string)$url);
    if (!is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
        return '[invalid-url]';
    }
    $port = isset($parts['port']) ? ':' . (int)$parts['port'] : '';
    return strtolower($parts['scheme']) . '://' . strtolower($parts['host']) . $port;
}

function ipInCidrV4($ip, $cidr) {
    list($subnet, $bits) = explode('/', $cidr);
    $ipLong = ip2long($ip);
    $subnetLong = ip2long($subnet);
    if ($ipLong === false || $subnetLong === false) {
        return false;
    }
    $mask = -1 << (32 - (int)$bits);
    return ($ipLong & $mask) === ($subnetLong & $mask);
}

function isPublicIpAddress($ip) {
    $ip = trim((string)$ip, " \t\n\r\0\x0B[]");
    if ($ip === '') {
        return false;
    }

    $packed = @inet_pton($ip);
    if ($packed === false) {
        return false;
    }

    // Handle IPv6 (16 bytes)
    if (strlen($packed) === 16) {
        // Detect IPv4-mapped IPv6 (::ffff:0:0/96) and validate embedded IPv4
        $v4MappedPrefix = "\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xff";
        if (substr($packed, 0, 12) === $v4MappedPrefix) {
            $embeddedV4 = @inet_ntop(substr($packed, 12, 4));
            return $embeddedV4 !== false ? isPublicIpAddress($embeddedV4) : false;
        }

        // Detect IPv4-compatible IPv6 (::/96 except :: and ::1)
        $zeroPrefix = str_repeat("\x00", 12);
        if (substr($packed, 0, 12) === $zeroPrefix) {
            return false;
        }

        // Reject unspecified (::) and loopback (::1)
        if ($packed === str_repeat("\x00", 16) || $packed === str_repeat("\x00", 15) . "\x01") {
            return false;
        }

        $firstByte = ord($packed[0]);
        $secondByte = ord($packed[1]);

        // Reject ULA fc00::/7
        if (($firstByte & 0xfe) === 0xfc) {
            return false;
        }
        // Reject link-local fe80::/10
        if ($firstByte === 0xfe && ($secondByte & 0xc0) === 0x80) {
            return false;
        }
        // Reject site-local fec0::/10
        if ($firstByte === 0xfe && ($secondByte & 0xc0) === 0xc0) {
            return false;
        }
        // Reject multicast ff00::/8
        if ($firstByte === 0xff) {
            return false;
        }
        // Reject NAT64 well-known prefix 64:ff9b::/96
        if (substr($packed, 0, 12) === "\x00\x64\xff\x9b\x00\x00\x00\x00\x00\x00\x00\x00") {
            return false;
        }
        // Reject documentation 2001:db8::/32
        if (substr($packed, 0, 4) === "\x20\x01\x0d\xb8") {
            return false;
        }

        return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false;
    }

    // Handle IPv4 (4 bytes)
    if (strlen($packed) === 4) {
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
            return false;
        }
        $blockedCidrs = [
            '0.0.0.0/8',
            '10.0.0.0/8',
            '100.64.0.0/10',
            '127.0.0.0/8',
            '169.254.0.0/16',
            '172.16.0.0/12',
            '192.0.0.0/24',
            '192.0.2.0/24',
            '192.168.0.0/16',
            '198.18.0.0/15',
            '198.51.100.0/24',
            '203.0.113.0/24',
            '224.0.0.0/4',
            '240.0.0.0/4',
        ];
        foreach ($blockedCidrs as $cidr) {
            if (ipInCidrV4($ip, $cidr)) {
                return false;
            }
        }
        return true;
    }

    return false;
}

function resolveHostIps($host) {
    $cleanHost = trim((string)$host, " \t\n\r\0\x0B[]");
    if ($cleanHost === '') {
        return [];
    }

    if (filter_var($cleanHost, FILTER_VALIDATE_IP) !== false) {
        return [$cleanHost];
    }

    $ips = [];
    if (function_exists('dns_get_record')) {
        $recordsA = @dns_get_record($cleanHost, DNS_A);
        if (is_array($recordsA)) {
            foreach ($recordsA as $rec) {
                if (!empty($rec['ip'])) {
                    $ips[] = $rec['ip'];
                }
            }
        }
        $recordsAAAA = @dns_get_record($cleanHost, DNS_AAAA);
        if (is_array($recordsAAAA)) {
            foreach ($recordsAAAA as $rec) {
                if (!empty($rec['ipv6'])) {
                    $ips[] = $rec['ipv6'];
                }
            }
        }
    }

    if (empty($ips)) {
        $fallback = @gethostbynamel($cleanHost);
        if (is_array($fallback)) {
            $ips = array_merge($ips, $fallback);
        }
    }

    return array_values(array_unique($ips));
}

function validateExternalM3uUrl($url, callable $customResolver = null) {
    $url = trim((string)$url);
    if ($url === '' || strlen($url) > 2048) {
        return ['ok' => false, 'http_code' => 400, 'message' => 'URL invalida ou nao informada.'];
    }

    $parts = @parse_url($url);
    if (!is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
        return ['ok' => false, 'http_code' => 400, 'message' => 'Formato de URL invalido.'];
    }

    $scheme = strtolower($parts['scheme']);
    if ($scheme !== 'http' && $scheme !== 'https') {
        return ['ok' => false, 'http_code' => 403, 'message' => 'Esquema de URL nao permitido. Use apenas HTTP ou HTTPS.'];
    }

    $host = strtolower(trim((string)$parts['host'], '[]'));
    if ($host === '' || $host === 'localhost' || substr($host, -10) === '.localhost' || substr($host, -6) === '.local' || substr($host, -9) === '.internal') {
        return ['ok' => false, 'http_code' => 403, 'message' => 'Destino interno ou local bloqueado por politica de seguranca.'];
    }

    $port = isset($parts['port']) ? (int)$parts['port'] : ($scheme === 'https' ? 443 : 80);
    if ($port < 1 || $port > 65535) {
        return ['ok' => false, 'http_code' => 400, 'message' => 'Porta de destino invalida.'];
    }

    $ips = $customResolver !== null ? $customResolver($host) : resolveHostIps($host);
    if (!is_array($ips) || empty($ips)) {
        return ['ok' => false, 'http_code' => 400, 'message' => 'Nao foi possivel resolver o dominio informado.'];
    }

    $pinnedIp = null;
    foreach ($ips as $ip) {
        if (!isPublicIpAddress($ip)) {
            return ['ok' => false, 'http_code' => 403, 'message' => 'Endereco IP privado, loopback ou reservado bloqueado (protecao SSRF).'];
        }
        // Prefer IPv4 when available for compatibility, otherwise accept public IPv6
        if ($pinnedIp === null || (strpos($pinnedIp, ':') !== false && strpos($ip, ':') === false)) {
            $pinnedIp = $ip;
        }
    }

    return [
        'ok' => true,
        'scheme' => $scheme,
        'host' => $host,
        'port' => $port,
        'pinned_ip' => $pinnedIp,
        'url' => $url,
    ];
}

function resolveRedirectTarget($baseUrl, $location) {
    $location = trim((string)$location);
    if ($location === '') {
        return '';
    }
    if (preg_match('/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//', $location)) {
        return $location;
    }
    $base = @parse_url($baseUrl);
    if (!is_array($base) || empty($base['scheme']) || empty($base['host'])) {
        return '';
    }
    $scheme = strtolower($base['scheme']);
    $host = $base['host'];
    $port = isset($base['port']) ? ':' . (int)$base['port'] : '';

    if (strpos($location, '//') === 0) {
        return $scheme . ':' . $location;
    }
    if ($location[0] === '/') {
        return "{$scheme}://{$host}{$port}{$location}";
    }
    $basePath = isset($base['path']) ? preg_replace('#/[^/]*$#', '/', $base['path']) : '/';
    return "{$scheme}://{$host}{$port}{$basePath}{$location}";
}

function safeFetchExternalM3u($url, array $options = []) {
    $maxRedirects = isset($options['max_redirects']) ? (int)$options['max_redirects'] : 4;
    $maxBytes = isset($options['max_bytes']) ? (int)$options['max_bytes'] : 52428800; // 50 MB
    $connectTimeout = isset($options['connect_timeout']) ? (int)$options['connect_timeout'] : 15;
    $timeout = isset($options['timeout']) ? (int)$options['timeout'] : 90;
    $customResolver = isset($options['resolver']) && is_callable($options['resolver']) ? $options['resolver'] : null;

    $currentUrl = trim((string)$url);

    for ($hop = 0; $hop <= $maxRedirects; $hop++) {
        $check = validateExternalM3uUrl($currentUrl, $customResolver);
        if (!$check['ok']) {
            return $check;
        }

        $body = '';
        $totalBytes = 0;
        $sizeExceeded = false;
        $redirectLocation = null;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $currentUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
        curl_setopt($ch, CURLOPT_MAXREDIRS, 0);
        curl_setopt($ch, CURLOPT_PROTOCOLS, CURLPROTO_HTTP | CURLPROTO_HTTPS);
        curl_setopt($ch, CURLOPT_REDIR_PROTOCOLS, CURLPROTO_HTTP | CURLPROTO_HTTPS);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $connectTimeout);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        curl_setopt($ch, CURLOPT_USERAGENT, 'IPTVSmartersPro');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: */*',
            'Connection: close',
        ]);

        // Pin validated IP to defend against DNS rebinding
        $resolveHost = $check['host'];
        $pinnedIp = strpos($check['pinned_ip'], ':') !== false
            ? '[' . $check['pinned_ip'] . ']'
            : $check['pinned_ip'];
        curl_setopt($ch, CURLOPT_RESOLVE, ["{$resolveHost}:{$check['port']}:{$pinnedIp}"]);

        curl_setopt($ch, CURLOPT_HEADERFUNCTION, function ($curl, $headerLine) use (&$redirectLocation) {
            $len = strlen($headerLine);
            if (stripos($headerLine, 'Location:') === 0) {
                $redirectLocation = trim(substr($headerLine, 9));
            }
            return $len;
        });

        curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($curl, $chunk) use (&$body, &$totalBytes, &$sizeExceeded, $maxBytes) {
            $len = strlen($chunk);
            $totalBytes += $len;
            if ($totalBytes > $maxBytes) {
                $sizeExceeded = true;
                return 0; // Abort transfer immediately
            }
            $body .= $chunk;
            return $len;
        });

        $execOk = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErrno = curl_errno($ch);
        curl_close($ch);

        if ($sizeExceeded) {
            return [
                'ok' => false,
                'http_code' => 413,
                'message' => 'A lista M3U excede o limite maximo permitido pelo servidor.',
            ];
        }

        if ($execOk === false && $curlErrno !== 0) {
            return [
                'ok' => false,
                'http_code' => 502,
                'message' => 'Falha ao conectar ao servidor de origem (' . sanitizeUrlForLog($currentUrl) . ').',
            ];
        }

        // Manual redirect handling with full SSRF re-validation on every hop
        if (in_array($httpCode, [301, 302, 303, 307, 308], true) && !empty($redirectLocation)) {
            if ($hop >= $maxRedirects) {
                return [
                    'ok' => false,
                    'http_code' => 400,
                    'message' => 'Limite maximo de redirecionamentos excedido.',
                ];
            }
            $nextUrl = resolveRedirectTarget($currentUrl, $redirectLocation);
            if ($nextUrl === '') {
                return [
                    'ok' => false,
                    'http_code' => 400,
                    'message' => 'Redirecionamento invalido recebido do servidor de origem.',
                ];
            }
            $currentUrl = $nextUrl;
            continue;
        }

        if ($httpCode < 200 || $httpCode >= 400) {
            return [
                'ok' => false,
                'http_code' => $httpCode >= 400 ? $httpCode : 502,
                'message' => 'Erro ao baixar lista M3U do servidor de origem (HTTP ' . $httpCode . ').',
            ];
        }

        return [
            'ok' => true,
            'http_code' => $httpCode,
            'body' => $body,
        ];
    }

    return [
        'ok' => false,
        'http_code' => 400,
        'message' => 'Limite maximo de redirecionamentos excedido.',
    ];
}
