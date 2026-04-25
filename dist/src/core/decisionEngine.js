"use strict";
/**
 * Decision Engine - Core logic for selecting best cell
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBestCell = getBestCell;
exports.shouldChangeTarget = shouldChangeTarget;
exports.updateUserDecision = updateUserDecision;
exports.getCurrentDecision = getCurrentDecision;
exports.makeDecision = makeDecision;
const gridService_1 = require("../modules/gridService");
const scoring_1 = require("./scoring");
const smoothing_1 = require("./smoothing");
// In-memory storage for user decisions (for hysteresis)
const userDecisions = new Map();
/**
 * Get best cell for user location
 */
function getBestCell(userLat, userLng, context) {
    // Get nearby cells (~2km radius, 0.02 degrees)
    const nearbyCells = (0, gridService_1.getNearbyCells)(userLat, userLng, 0.02);
    if (nearbyCells.length === 0) {
        return null; // Fallback will handle
    }
    // Calculate scores
    const scoredCells = nearbyCells.map(cell => ({
        ...cell,
        score: (0, scoring_1.calculateCellScore)(cell, context)
    }));
    // Apply smoothing
    const smoothedCells = (0, smoothing_1.smoothScores)(scoredCells);
    // Sort by score descending
    smoothedCells.sort((a, b) => b.score - a.score);
    // Return top 1
    return smoothedCells[0] || null;
}
/**
 * Check if should change target (hysteresis)
 */
function shouldChangeTarget(userId, newCell, newScore) {
    const currentDecision = userDecisions.get(userId);
    if (!currentDecision) {
        return true; // No previous decision, change
    }
    const now = Date.now();
    const timeDiff = now - currentDecision.timestamp;
    // Change if new score is 10+ higher OR current is older than 90 seconds
    if (newScore >= currentDecision.score + 10 || timeDiff > 90000) {
        return true;
    }
    return false;
}
/**
 * Update user decision
 */
function updateUserDecision(userId, cell, score) {
    const decision = {
        cell,
        score,
        timestamp: Date.now()
    };
    userDecisions.set(userId, decision);
}
/**
 * Get current decision for user
 */
function getCurrentDecision(userId) {
    return userDecisions.get(userId) || null;
}
/**
 * Make decision with hysteresis
 */
function makeDecision(userId, userLat, userLng, context) {
    const newCell = getBestCell(userLat, userLng, context);
    if (!newCell) {
        // Fallback: return closest cell
        const allCells = (0, gridService_1.getAllCells)();
        if (allCells.length > 0) {
            // Find closest cell
            let closestCell = allCells[0];
            let minDistance = Number.MAX_VALUE;
            for (const cell of allCells) {
                const distance = Math.sqrt(Math.pow(cell.lat - userLat, 2) + Math.pow(cell.lng - userLng, 2));
                if (distance < minDistance) {
                    minDistance = distance;
                    closestCell = cell;
                }
            }
            // Calculate score for fallback
            const score = (0, scoring_1.calculateCellScore)(closestCell, context);
            return { cell: closestCell, score, changed: true };
        }
        throw new Error('No cells available');
    }
    const newScore = (0, scoring_1.calculateCellScore)(newCell, context);
    const shouldChange = shouldChangeTarget(userId, newCell, newScore);
    if (shouldChange) {
        updateUserDecision(userId, newCell, newScore);
        return { cell: newCell, score: newScore, changed: true };
    }
    else {
        // Return current decision
        const current = getCurrentDecision(userId);
        if (current) {
            return { cell: current.cell, score: current.score, changed: false };
        }
        else {
            // Should not happen, but fallback
            updateUserDecision(userId, newCell, newScore);
            return { cell: newCell, score: newScore, changed: true };
        }
    }
}
//# sourceMappingURL=decisionEngine.js.map