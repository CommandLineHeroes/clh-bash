export default function(ms) {
    return new Promise((resolve, reject) => setTimeout(resolve, ms));
}
