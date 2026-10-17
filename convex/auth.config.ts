// JWT issuer for Convex Auth: this deployment's own site URL (ADR-015).
const authConfig = {
  providers: [{ domain: process.env.CONVEX_SITE_URL, applicationID: "convex" }],
};

export default authConfig;
