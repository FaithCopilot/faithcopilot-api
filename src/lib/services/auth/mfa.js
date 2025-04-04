export const getMFAConfig = ({ issuer, label, secret }) => ({
  issuer,
  label,
  algorithm: "SHA1",
  digits: 6,
  period: 30,
  secret,
});
