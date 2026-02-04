/**
 * Expo Config Plugin for Android Network Security Configuration
 *
 * This plugin adds certificate pinning and network security settings for Android.
 *
 * To enable certificate pinning:
 * 1. Get your server's SSL certificate public key hash (SHA-256, base64 encoded)
 * 2. Update the PIN_HASHES array below with your certificate pins
 * 3. Rebuild the app with `eas build`
 *
 * To get your certificate pin hash, run:
 * openssl s_client -connect your-api-domain.com:443 | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
 */

const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    // Set to true to enable certificate pinning in production
    enableCertificatePinning: false,

    // Your API domain(s) to pin certificates for
    pinnedDomains: [
        // Add your production API domain here
        // Example: 'api.walkdog.com'
    ],

    // Certificate pin hashes (SHA-256, base64 encoded)
    // You need at least 2 pins: current certificate and a backup
    pinHashes: [
        // Add your certificate pin hashes here
        // Example: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
        // Example backup: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB='
    ],

    // Pin expiration date (YYYY-MM-DD) - pins expire after this date
    // This prevents lockout if you lose your pinned certificates
    pinExpiration: '2026-12-31',
};

/**
 * Generate network_security_config.xml content
 */
function generateNetworkSecurityConfig() {
    const domains = CONFIG.pinnedDomains;
    const pins = CONFIG.pinHashes;
    const expiration = CONFIG.pinExpiration;

    let pinSetXml = '';
    if (CONFIG.enableCertificatePinning && domains.length > 0 && pins.length >= 2) {
        const pinsXml = pins.map(pin => `            <pin digest="SHA-256">${pin}</pin>`).join('\n');
        const domainsXml = domains.map(domain => `        <domain includeSubdomains="true">${domain}</domain>`).join('\n');

        pinSetXml = `
    <domain-config>
${domainsXml}
        <pin-set expiration="${expiration}">
${pinsXml}
        </pin-set>
    </domain-config>`;
    }

    // Generate the full config
    return `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Base config for all connections -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <!-- Trust system CAs -->
            <certificates src="system" />
        </trust-anchors>
    </base-config>

    <!-- Debug config - allows localhost HTTP in debug builds -->
    <debug-overrides>
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </debug-overrides>
${pinSetXml}
</network-security-config>
`;
}

/**
 * Modify AndroidManifest to reference network security config
 */
const withNetworkSecurityManifest = (config) => {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;
        const application = androidManifest.manifest.application?.[0];

        if (application) {
            application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
        }

        return config;
    });
};

/**
 * Create the network_security_config.xml file
 */
const withNetworkSecurityConfigFile = (config) => {
    return withDangerousMod(config, [
        'android',
        async (config) => {
            const xmlDir = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');

            // Create xml directory if it doesn't exist
            if (!fs.existsSync(xmlDir)) {
                fs.mkdirSync(xmlDir, { recursive: true });
            }

            // Write the network security config
            const configContent = generateNetworkSecurityConfig();
            const configPath = path.join(xmlDir, 'network_security_config.xml');
            fs.writeFileSync(configPath, configContent);

            console.log('[NetworkSecurityConfig] Created network_security_config.xml');
            if (CONFIG.enableCertificatePinning) {
                console.log('[NetworkSecurityConfig] Certificate pinning enabled for:', CONFIG.pinnedDomains);
            } else {
                console.log('[NetworkSecurityConfig] Certificate pinning disabled (HTTPS still enforced)');
            }

            return config;
        },
    ]);
};

/**
 * Main plugin export
 */
module.exports = function withNetworkSecurityConfig(config) {
    config = withNetworkSecurityManifest(config);
    config = withNetworkSecurityConfigFile(config);
    return config;
};
