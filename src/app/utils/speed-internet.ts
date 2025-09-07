
export function checkConnection(): boolean {
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (connection) {
       // If the connection object exists, it implies the Network Information API is available.
       return connection.downlink >= 1; // Check if the downlink speed is at least 1 Mbps
    }
    return true;
}

export function checkInternetSpeed(speed: number): string {
    if (speed < 1) {
        return 'Very Slow';
    } else if (speed < 5) {
        return 'Slow';
    } else if (speed < 20) {
        return 'Moderate';
    } else if (speed < 50) {
        return 'Fast';
    } else {
        return 'Very Fast';
    }
}
export function getInternetSpeedDescription(speed: number): string {
    const speedCategory = checkInternetSpeed(speed);
    switch (speedCategory) {
        case 'Very Slow':
            return 'Your internet speed is very slow. Consider upgrading your plan.';
        case 'Slow':
            return 'Your internet speed is slow. You may experience buffering.';
        case 'Moderate':
            return 'Your internet speed is moderate. Suitable for basic browsing.';
        case 'Fast':
            return 'Your internet speed is fast. Good for streaming and gaming.';
        case 'Very Fast':
            return 'Your internet speed is very fast. Excellent for all online activities.';
        default:
            return 'Unknown speed category.';
    }
}
export function getInternetSpeedEmoji(speed: number): string {
    const speedCategory = checkInternetSpeed(speed);
    switch (speedCategory) {
        case 'Very Slow':
            return '🐢'; // Turtle
        case 'Slow':
            return '🐌'; // Snail
        case 'Moderate':
            return '🚶'; // Walking person
        case 'Fast':
            return '🏃'; // Running person
        case 'Very Fast':
            return '🚀'; // Rocket
        default:
            return '❓'; // Question mark for unknown speed
    }
}
export function getInternetSpeedIcon(speed: number): string {
    const speedCategory = checkInternetSpeed(speed);
    switch (speedCategory) {
        case 'Very Slow':
            return 'slow'; // Icon for very slow speed
        case 'Slow':
            return 'slow'; // Icon for slow speed
        case 'Moderate':
            return 'moderate'; // Icon for moderate speed
        case 'Fast':
            return 'fast'; // Icon for fast speed
        case 'Very Fast':
            return 'very-fast'; // Icon for very fast speed
        default:
            return 'unknown'; // Icon for unknown speed
    }
}
export function getInternetSpeedColor(speed: number): string {
    const speedCategory = checkInternetSpeed(speed);
    switch (speedCategory) {
        case 'Very Slow':
            return 'red'; // Color for very slow speed
        case 'Slow':
            return 'orange'; // Color for slow speed
        case 'Moderate':
            return 'yellow'; // Color for moderate speed
        case 'Fast':
            return 'green'; // Color for fast speed
        case 'Very Fast':
            return 'blue'; // Color for very fast speed
        default:
            return 'gray'; // Color for unknown speed
    }
}
export function getInternetSpeedLabel(speed: number): string {
    const speedCategory = checkInternetSpeed(speed);
    switch (speedCategory) {
        case 'Very Slow':
            return 'Very Slow Speed';
        case 'Slow':
            return 'Slow Speed';
        case 'Moderate':
            return 'Moderate Speed';
        case 'Fast':
            return 'Fast Speed';
        case 'Very Fast':
            return 'Very Fast Speed';
        default:
            return 'Unknown Speed';
    }
}
export function getInternetSpeedTooltip(speed: number): string {
    const speedCategory = checkInternetSpeed(speed);
    switch (speedCategory) {
        case 'Very Slow':
            return 'This speed is below 1 Mbps. Consider upgrading your internet plan.';
        case 'Slow':
            return 'This speed is between 1 and 5 Mbps. You may experience buffering during streaming.';
        case 'Moderate':
            return 'This speed is between 5 and 20 Mbps. Suitable for basic browsing and streaming.';
        case 'Fast':
            return 'This speed is between 20 and 50 Mbps. Good for HD streaming and online gaming.';
        case 'Very Fast':
            return 'This speed is above 50 Mbps. Excellent for all online activities, including 4K streaming.';
        default:
            return 'Unknown internet speed category.';
    }
}
export function getInternetSpeedAdvice(speed: number): string {
    const speedCategory = checkInternetSpeed(speed);
    switch (speedCategory) {
        case 'Very Slow':
            return 'Consider upgrading your internet plan for a better experience.';
        case 'Slow':
            return 'You may want to check your connection or consider a plan upgrade.';
        case 'Moderate':
            return 'This speed is generally acceptable for most online activities.';
        case 'Fast':
            return 'You should have a good experience with streaming and gaming.';
        case 'Very Fast':
            return 'Enjoy your high-speed internet for all activities!';
        default:
            return 'No specific advice available for this speed category.';
    }
}
export function getInternetSpeedRecommendation(speed: number): string {
    const speedCategory = checkInternetSpeed(speed);
    switch (speedCategory) {
        case 'Very Slow':
            return 'Upgrade your plan or check for network issues.';
        case 'Slow':
            return 'Consider optimizing your network settings or upgrading your plan.';
        case 'Moderate':
            return 'This speed is generally sufficient for most users.';
        case 'Fast':
            return 'You should be able to stream HD content and play online games without issues.';
        case 'Very Fast':
            return 'Enjoy seamless streaming, gaming, and downloading!';
        default:
            return 'No specific recommendation available for this speed category.';
    }
}