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

  const gravity = 1.5;
  const jumpForce = 40; // Adjust jump force to make it more responsive
  const baseGameSpeed = 6; // Base speed for obstacles
  const gameSpeedMultiplier = 1.5; // Adjust game speed scaling

  let lastTimestamp = 0;

  interface Obstacle {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'rock' | 'monster';
  }

  const astronautImg = new Image();
  astronautImg.src = 'astronaut-no-bg.svg';

  const asteroidImg = new Image();
  asteroidImg.src = 'rock.svg';

  const monsterImg = new Image();
  monsterImg.src = 'monster.svg';

  const backgroundImg = new Image();
  backgroundImg.src = 'space-bg.jpg';

  const handleRestart = () => {
    setIsGameOver(false);
    scoreRef.current = 0;
    astronautYRef.current = 500;
    astronautVelocityRef.current = 0;
    obstaclesRef.current = [];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let animationFrameId: number;
    let obstacleTimer = 0;
    let nextObstacleTime = randomBetween(80, 140);

    function randomBetween(min: number, max: number) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const spawnObstacle = () => {
      const fromTop = Math.random() < 0.5;
      const obstacleType = Math.random() < 0.5 ? 'rock' : 'monster';
      obstaclesRef.current.push({
        x: canvas.width,
        y: fromTop ? 50 : 520,
        width: 120,
        height: 120,
        type: obstacleType,
      });
    };

    const handleAstronaut = () => {
      if (isJumpingRef.current) {
        astronautVelocityRef.current = -jumpForce;
        isJumpingRef.current = false;
      }

      astronautVelocityRef.current += gravity; // Gravity
      astronautYRef.current += astronautVelocityRef.current;

      if (astronautYRef.current > 500) {
        astronautYRef.current = 500;
        astronautVelocityRef.current = 0;
      }
      if (astronautYRef.current < 0) {
        astronautYRef.current = 0;
        astronautVelocityRef.current = 0;
      }

      ctx.drawImage(astronautImg, 150, astronautYRef.current, 120, 120);
    };

    const handleObstacles = () => {
      obstaclesRef.current.forEach((obs, index) => {
        obs.x -= baseGameSpeed * gameSpeedMultiplier; // Adjust speed scaling

        const image = obs.type === 'rock' ? asteroidImg : monsterImg;
        ctx.drawImage(image, obs.x, obs.y, obs.width, obs.height);

        if (obs.x + obs.width < 0) {
          obstaclesRef.current.splice(index, 1);
          scoreRef.current += 1;
        }

        const astronautCollisionBox = {
          x: 150 + 35,
          y: astronautYRef.current + 40,
          width: 50,
          height: 50,
        };

        const obstacleBox = {
          x: obs.x + 20,
          y: obs.y + 20,
          width: obs.width - 40,
          height: obs.height - 40,
        };

        if (
          astronautCollisionBox.x < obstacleBox.x + obstacleBox.width &&
          astronautCollisionBox.x + astronautCollisionBox.width > obstacleBox.x &&
          astronautCollisionBox.y < obstacleBox.y + obstacleBox.height &&
          astronautCollisionBox.y + astronautCollisionBox.height > obstacleBox.y
        ) {
          setFinalScore(scoreRef.current);
          setIsGameOver(true);
        }
      });
    };

    const drawScore = () => {
      ctx.fillStyle = 'white';
      ctx.font = '24px Arial';
      ctx.fillText(`Score: ${scoreRef.current}`, 20, 40);
    };

    const gameLoop = (timestamp: number) => {
      const deltaTime = (timestamp - lastTimestamp) / 1000; // Convert to seconds
      lastTimestamp = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

      if (!isGameOver) {
        handleAstronaut();
        handleObstacles();

        obstacleTimer++;
        if (obstacleTimer > nextObstacleTime) {
          spawnObstacle();
          obstacleTimer = 0;
          nextObstacleTime = randomBetween(80, 140);
        }

        drawScore();
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && astronautYRef.current === 500 && !isGameOver) {
        isJumpingRef.current = true;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    astronautImg.onload = () => {
      backgroundImg.onload = () => {
        gameLoop(0); // Start the game loop
      };
    };

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isGameOver]);

  return (
    <div
      style={{
        textAlign: 'center',
        background: 'black',
        height: '100vh',
        position: 'relative',
        backgroundImage: 'url("/space-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <h1
        style={{
          fontFamily: '"Courier New", Courier, monospace',
          color: 'white',
          fontSize: '36px',
          margin: '0',
          paddingTop: '20px',
        }}
      >
        Space Runner 🛸
      </h1>

      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas
          ref={canvasRef}
          width={1200}
          height={600}
          style={{
            border: '2px solid white',
            background: 'black',
            marginTop: '30px',
          }}
        />

        {isGameOver && (
          <>
            <div
              style={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                fontSize: '48px',
                fontWeight: 'bold',
              }}
            >
              Game Over
            </div>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                fontSize: '28px',
              }}
            >
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
