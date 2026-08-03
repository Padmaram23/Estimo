"use client";

import { useEffect, useRef } from "react";

const LABELS = [
  "$0.002/1K", "$2.00/M", "~$12/mo", "$0.40/M", "$0.13/M",
  "$49/mo", "3M tokens", "$0.07/M", "$0.10/M", "free tier",
  "$0.27/M", "$79/mo", "$0.80/M", "pay/use", "$0.06/M",
  "$39/mo", "$0.59/M", "$1.25/M", "$0.02/M", "$3.00/M",
];

const NODE_COUNT = 55;
const CONN_DIST  = 155;
const LABEL_NODES = 20;
const SWAP_EVERY  = 200;

interface Node {
  x: number; y: number;
  vx: number; vy: number;
  pulse: number; pulseSpeed: number;
  labelIdx: number;
  nextLabelIdx: number;
  swapTimer: number;
  swapOffset: number;
  fadeOut: number;
  fadeIn: number;
  transitioning: boolean;
}

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let nodes: Node[] = [];

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const randLabel = (exclude = -1): number => {
      let idx = Math.floor(Math.random() * LABELS.length);
      if (idx === exclude) idx = (idx + 1) % LABELS.length;
      return idx;
    };

    const init = () => {
      nodes = Array.from({ length: NODE_COUNT }, () => {
        const l = randLabel();
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.018 + Math.random() * 0.018,
          labelIdx: l, nextLabelIdx: l,
          swapTimer: 0,
          swapOffset: Math.floor(Math.random() * SWAP_EVERY),
          fadeOut: 1, fadeIn: 0,
          transitioning: false,
        };
      });
    };

    const drawLabel = (x: number, y: number, text: string, alpha: number) => {
      if (alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, x, y);
      ctx.restore();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // update
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        n.pulse += n.pulseSpeed;
        if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

        if (i < LABEL_NODES) {
          if (!n.transitioning) {
            if (++n.swapTimer >= SWAP_EVERY + (n.swapOffset % 80)) {
              n.swapTimer = 0;
              n.nextLabelIdx = randLabel(n.labelIdx);
              n.transitioning = true;
              n.fadeOut = 1; n.fadeIn = 0;
            }
          } else {
            n.fadeOut = Math.max(0, n.fadeOut - 1 / 40);
            n.fadeIn  = Math.min(1, n.fadeIn  + 1 / 40);
            if (n.fadeOut <= 0 && n.fadeIn >= 1) {
              n.labelIdx = n.nextLabelIdx;
              n.fadeOut = 1; n.fadeIn = 0;
              n.transitioning = false;
            }
          }
        }
      }

      // connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONN_DIST) {
            const a = (1 - dist / CONN_DIST) * 0.55;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(255,255,255,${a})`;
            ctx.lineWidth = i < LABEL_NODES || j < LABEL_NODES ? 1.1 : 0.6;
            ctx.stroke();
          }
        }
      }

      // nodes + labels
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const glow = Math.sin(n.pulse) * 0.5 + 0.5;

        // dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, i < LABEL_NODES ? 2 : 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.2 + glow * 0.25})`;
        ctx.fill();

        // floating label above dot
        if (i < LABEL_NODES) {
          const baseAlpha = 0.2 + glow * 0.2;
          if (n.transitioning) {
            drawLabel(n.x, n.y - 14, LABELS[n.labelIdx],     n.fadeOut * baseAlpha);
            drawLabel(n.x, n.y - 14, LABELS[n.nextLabelIdx], n.fadeIn  * baseAlpha);
          } else {
            drawLabel(n.x, n.y - 14, LABELS[n.labelIdx], baseAlpha);
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    resize(); init(); draw();

    const onResize = () => { resize(); init(); };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
