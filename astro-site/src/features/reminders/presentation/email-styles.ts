/** Versioned email styles. Inline values deliberately work without website CSS/fonts. */
export const emailStyles={
  body:'margin:0;padding:0;background-color:#f3f0e9;color:#242424;font-family:Arial,Helvetica,sans-serif;',
  shell:'width:100%;max-width:600px;margin:0 auto;background-color:#ffffff;',
  brand:'padding:28px 24px;background-color:#111111;color:#d9bd6e;text-align:center;font-family:Georgia,serif;font-size:28px;letter-spacing:2px;',
  content:'padding:28px 24px;',
  title:'margin:0 0 18px;font-family:Georgia,serif;font-size:30px;line-height:1.25;color:#242424;',
  paragraph:'margin:0 0 22px;font-size:16px;line-height:1.65;color:#333333;',
  section:'margin:28px 0 16px;font-family:Georgia,serif;font-size:23px;line-height:1.3;color:#242424;',
  card:'width:100%;margin:0 0 24px;border:1px solid #e0d6be;border-collapse:separate;border-spacing:0;',
  image:'display:block;width:100%;max-width:552px;height:auto;border:0;',
  cardContent:'padding:20px;',
  cardTitle:'margin:0 0 14px;font-family:Georgia,serif;font-size:21px;line-height:1.4;color:#242424;',
  price:'margin:0 0 14px;font-size:16px;line-height:1.5;color:#333333;',
  button:'display:inline-block;padding:14px 22px;background-color:#d9bd6e;border:1px solid #d9bd6e;color:#111111;font-size:16px;font-weight:bold;line-height:1.3;text-decoration:none;border-radius:6px;',
  link:'color:#6b4d0c;text-decoration:underline;line-height:1.6;',
  footer:'padding:24px;background-color:#eee9df;font-size:14px;line-height:1.65;color:#333333;',
  small:'margin:0 0 16px;font-size:14px;line-height:1.65;color:#444444;',
} as const;
