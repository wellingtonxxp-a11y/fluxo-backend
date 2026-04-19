import { validateInsideSP } from "../services/zone.service";

export default function geo(req: any, res: any, next: any) {
  const lat = parseFloat(req.body.lat ?? req.query.lat);
  const lng = parseFloat(req.body.lng ?? req.query.lng);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ success: false, error: "Latitude e longitude obrigatórias" });
  }

  if (!validateInsideSP(lat, lng)) {
    return res.status(400).json({ success: false, error: "Localização fora de São Paulo" });
  }

  req.location = { lat, lng };
  return next();
}
