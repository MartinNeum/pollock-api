
/**
 * Generates a random share token.
 *
 * @returns {string} The randomly generated share token
 */
function generateShareToken() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const tokenLength = 15;
    let token = 'S-';

    for (let i = 0; i < tokenLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters.charAt(randomIndex);
    }
    return token;
}

/**
 * Generates a random admin token.
 *
 * @returns {string} The randomly generated admin token
 */
function generateAdminToken() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const tokenLength = 15;
    let token = 'A-';

    for (let i = 0; i < tokenLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters.charAt(randomIndex);
    }

    return token;
}

/**
 * Generates a random edit token.
 *
 * @returns {string} The randomly generated edit token
 */
function generateEditToken() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const tokenLength = 15;
    let token = 'E-';

    for (let i = 0; i < tokenLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters.charAt(randomIndex);
    }

    return token;
}

/**
 * Generates a random API-KEY.
 *
 * @returns {string} The randomly generated API-KEY
 */
function generateAPIKey() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const tokenLength = 20;
    let token = 'U-';

    for (let i = 0; i < tokenLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters.charAt(randomIndex);
    }

    return token;
}

module.exports = {
    generateEditToken,
    generateShareToken,
    generateAdminToken,
    generateAPIKey
};