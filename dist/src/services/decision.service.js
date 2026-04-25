"use strict";
function generateInstruction(cluster, place) {
    const { trend = "stable", predicted = 0, acceleration = 0 } = cluster || {};
    const name = place?.name || "ponto estratégico";
    const address = place?.address || "";
    let action = "explore";
    let message = "";
    // ================= DECISÃO =================
    if (trend === "rising" && predicted >= 5) {
        action = "go";
        message = address
            ? `Vá para ${name} (${address}), alta chance de corridas agora`
            : `Vá para ${name}, alta chance de corridas agora`;
    }
    else if (trend === "stable" && predicted >= 3) {
        action = "hold";
        message = `Permaneça na região, fluxo consistente`;
    }
    else if (trend === "falling") {
        action = "avoid";
        message = `Evite essa área, demanda em queda`;
    }
    else {
        action = "explore";
        message = `Explore áreas próximas, baixa atividade no momento`;
    }
    // ================= INTENSIDADE =================
    let intensity = "low";
    if (predicted >= 8)
        intensity = "high";
    else if (predicted >= 4)
        intensity = "medium";
    // ================= CONFIANÇA =================
    let confidence = "low";
    if (predicted >= 8 && trend === "rising")
        confidence = "high";
    else if (predicted >= 4)
        confidence = "medium";
    // ================= DICA EXTRA =================
    let tip = null;
    if (action === "go" && intensity === "high") {
        tip = "Alta concentração de pedidos — aproveite agora";
    }
    else if (action === "avoid") {
        tip = "Considere mudar de região rapidamente";
    }
    return {
        action,
        message,
        intensity,
        confidence,
        tip,
        metrics: {
            predicted,
            trend,
            acceleration
        }
    };
}
module.exports = {
    generateInstruction
};
//# sourceMappingURL=decision.service.js.map