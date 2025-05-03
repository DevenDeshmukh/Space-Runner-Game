import React, { useEffect, useRef, useState } from 'react';

const SpaceRunnerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const astronautYRef = useRef(500);
  const astronautVelocityRef = useRef(0);
  const isJumpingRef = useRef(false);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const scoreRef = useRef(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const showExplosion = useRef(false);
  const explosionRef = useRef<{ x: number; y: number } | null>(null);
  const explosionTimerRef = useRef<number>(0);

  const gravity = 2.2;
  const jumpForce = 45;

  const baseGameSpeed = 10;
  const gameSpeedMultiplier = 1.5; // Adjust this value to control speed
  const speedIncrementFactor = 0.08;

  let lastTimestamp = 0;

  interface Obstacle {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'rock' | 'monster' | 'meteor' | 'flame';
    vx?: number;
    vy?: number;
  }

  const astronautImg = useRef(new Image());
  const asteroidImg = useRef(new Image());
  const monsterImg = useRef(new Image());
  const meteorImg = useRef(new Image());
  const flameImg = useRef(new Image());
  const backgroundImg = useRef(new Image());
  const explosionImg = useRef(new Image());

  useEffect(() => {
    astronautImg.current.src = 'astronaut-no-bg.svg';
    asteroidImg.current.src = 'rock.svg';
    monsterImg.current.src = 'monster.svg';
    meteorImg.current.src = 'meteor.svg';
    flameImg.current.src = 'flames.svg';
    backgroundImg.current.src = 'space-bg.jpg';
    explosionImg.current.src = 'explosion.svg';
  }, []);

  const jumpSound = useRef<HTMLAudioElement>(new Audio('/jump.mp3'));
  const gameStartSound = useRef<HTMLAudioElement>(new Audio('/game-start.mp3'));
  const gameOverSound = useRef<HTMLAudioElement>(new Audio('/game-over.mp3'));

  const handleRestart = () => {
    setIsGameOver(false);
    scoreRef.current = 0;
    astronautYRef.current = 500;
    astronautVelocityRef.current = 0;
    obstaclesRef.current = [];
    showExplosion.current = false;
    explosionRef.current = null;
    explosionTimerRef.current = 0;
    gameStartSound.current.currentTime = 0;
    gameStartSound.current.play();
  };

  const startGame = () => {
    setGameStarted(true);
    handleRestart();
  };

  useEffect(() => {
    if (!gameStarted) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let animationFrameId: number;
    let obstacleTimer = 0;
    let nextObstacleTime = 1600;

    const getRandomInt = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const spawnObstacle = () => {
        const typeRoll = Math.random();
        const obstacleType: Obstacle['type'] =
          typeRoll < 0.25 ? 'rock' :
          typeRoll < 0.5 ? 'monster' :
          typeRoll < 0.75 ? 'meteor' :
          'flame';
      
        let size = 140; // default
        if (obstacleType === 'monster') size = 160;
        if (obstacleType === 'flame') size = 160;
        if (obstacleType === 'meteor') size = 130;
      
        let xPos = canvas.width;
        let yPos = 0;
        let vx = -baseGameSpeed * gameSpeedMultiplier;
        let vy = 0;
      
        if (obstacleType === 'flame') {
          xPos = canvas.width + 100;
          vy = 6;
        } else {
          const spawnY = Math.random();
          yPos = spawnY < 0.33 ? canvas.height - size : spawnY < 0.66 ? canvas.height / 2 : 0;
        }
      
        obstaclesRef.current.push({ x: xPos, y: yPos, width: size, height: size, type: obstacleType, vx, vy });
      };
      

    const handleAstronaut = () => {
      if (isJumpingRef.current) {
        astronautVelocityRef.current = -jumpForce;
        isJumpingRef.current = false;
        jumpSound.current.currentTime = 0;
        jumpSound.current.play();
      }

      astronautVelocityRef.current += gravity;
      astronautYRef.current += astronautVelocityRef.current;

      if (astronautYRef.current > 500) astronautYRef.current = 500;
      if (astronautYRef.current < 0) astronautYRef.current = 0;

      ctx.drawImage(astronautImg.current, 150, astronautYRef.current, 100, 100);
    };

    const handleObstacles = () => {
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.x += obs.vx ?? 0;
        obs.y += obs.vy ?? 0;

        const img =
          obs.type === 'rock' ? asteroidImg.current :
          obs.type === 'monster' ? monsterImg.current :
          obs.type === 'meteor' ? meteorImg.current :
          flameImg.current;

        ctx.drawImage(img, obs.x, obs.y, obs.width, obs.height);

        if (obs.x + obs.width < 0 || obs.y > canvas.height) {
          obstaclesRef.current.splice(i, 1);
          scoreRef.current++;
          continue;
        }

        const astronautBox = { x: 190, y: astronautYRef.current + 30, width: 40, height: 60 };
        const obstacleBox = { x: obs.x + 20, y: obs.y + 20, width: obs.width - 40, height: obs.height - 40 };

        const isColliding =
          astronautBox.x < obstacleBox.x + obstacleBox.width &&
          astronautBox.x + astronautBox.width > obstacleBox.x &&
          astronautBox.y < obstacleBox.y + obstacleBox.height &&
          astronautBox.y + astronautBox.height > obstacleBox.y;

        if (isColliding) {
          setFinalScore(scoreRef.current);
          setIsGameOver(true);
          showExplosion.current = true;
          explosionRef.current = { x: 150, y: astronautYRef.current };
          explosionTimerRef.current = 30;
          gameOverSound.current.currentTime = 0;
          gameOverSound.current.play();
        }
      }
    };

    const drawExplosion = () => {
      if (showExplosion.current && explosionRef.current && explosionTimerRef.current > 0) {
        ctx.drawImage(explosionImg.current, explosionRef.current.x, explosionRef.current.y, 120, 120);
        explosionTimerRef.current--;
      }
    };

    const drawScore = () => {
      ctx.fillStyle = 'white';
      ctx.font = '24px Courier New';
      ctx.fillText(`Score: ${scoreRef.current}`, 20, 40);
    };

    const gameLoop = (timestamp: number) => {
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(backgroundImg.current, 0, 0, canvas.width, canvas.height);

      if (!isGameOver) {
        handleAstronaut();
        handleObstacles();

        obstacleTimer += delta;
        if (obstacleTimer > nextObstacleTime) {
          spawnObstacle();
          obstacleTimer = 0;
          nextObstacleTime = getRandomInt(1400, 2000);
        }

        drawScore();
      }

      drawExplosion();
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && astronautYRef.current === 500 && !isGameOver) {
        isJumpingRef.current = true;
      } else if (e.code === 'Enter' && isGameOver) {
        handleRestart();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    gameStartSound.current.play();
    gameLoop(0);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isGameOver, gameStarted]);

  return (
    <div
      style={{
        textAlign: 'center',
        backgroundImage: 'url("/space-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: '100vh',
        position: 'relative',
      }}
    >
      <h1 style={{ fontFamily: '"Courier New", Courier, monospace', color: 'white', fontSize: '36px', margin: '0', paddingTop: '20px' }}>
        Space Runner 🛸
      </h1>

      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas ref={canvasRef} width={1200} height={600} style={{ border: '2px solid white', background: 'black', marginTop: '30px' }} />

        {!gameStarted && (
          <button
            onClick={startGame}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'black',
              color: 'white',
              border: '2px solid white',
              padding: '12px 40px',
              fontSize: '28px',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            Start Game
          </button>
        )}

        {isGameOver && (
          <>
            <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: '48px', fontWeight: 'bold' }}>
              Game Over
            </div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: '28px' }}>
              Final Score: {finalScore}
            </div>
            <button
              onClick={handleRestart}
              style={{
                position: 'absolute',
                top: '60%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'black',
                color: 'white',
                border: '2px solid white',
                padding: '10px 30px',
                fontSize: '24px',
                cursor: 'pointer',
              }}
            >
              Restart
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SpaceRunnerGame;
