import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Server Status</title>

<style>
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    background: radial-gradient(circle at top, #1e293b, #020617);
    color: #fff;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card {
    text-align: center;
    padding: 50px 60px;
    border-radius: 20px;
    background: rgba(17, 24, 39, 0.75);
    backdrop-filter: blur(12px);
    box-shadow:
      0 10px 30px rgba(0,0,0,0.6),
      inset 0 0 0 1px rgba(255,255,255,0.05);
    animation: float 3s ease-in-out infinite;
  }

  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
    100% { transform: translateY(0px); }
  }

  .status {
    font-size: 48px;
    margin-bottom: 10px;
  }

  h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  p {
    margin-top: 10px;
    color: #9ca3af;
    font-size: 15px;
  }

  .badge {
    margin-top: 20px;
    display: inline-block;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 12px;
    background: linear-gradient(135deg, #22c55e, #4ade80);
    color: #022c22;
    font-weight: 600;
  }
</style>
</head>

<body>
  <div class="card">
    <div class="status">🚀</div>
    <h1>Server is Running</h1>
    <p>Your NestJS backend is healthy and ready.</p>
    <div class="badge">LIVE</div>
  </div>
</body>
</html>
    `;
  }
}
