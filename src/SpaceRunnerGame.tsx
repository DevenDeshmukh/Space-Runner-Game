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


 const showExplosion = useRef(false);
 const explosionRef = useRef<{ x: number; y: number } | null>(null);
 const explosionTimerRef = useRef<number>(0);


 const gravity = 1.5;
 const jumpForce = 40;
 const baseGameSpeed = 8;
 const gameSpeedMultiplier = 1.8;


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


 // Images
 const astronautImg = new Image();
 astronautImg.src = 'astronaut-no-bg.svg';


 const asteroidImg = new Image();
 asteroidImg.src = 'rock.svg';


 const monsterImg = new Image();
 monsterImg.src = 'monster.svg';


 const meteorImg = new Image();
 meteorImg.src = 'meteor.svg';


 const flameImg = new Image();
 flameImg.src = 'flames.svg';


 const backgroundImg = new Image();
 backgroundImg.src = 'space-bg.jpg';


 const explosionImg = new Image();
 explosionImg.src = 'explosion.svg';


 const handleRestart = () => {
   setIsGameOver(false);
   scoreRef.current = 0;
   astronautYRef.current = 500;
   astronautVelocityRef.current = 0;
   obstaclesRef.current = [];
   showExplosion.current = false;
   explosionRef.current = null;
   explosionTimerRef.current = 0;
 };


 useEffect(() => {
   const canvas = canvasRef.current;
   const ctx = canvas?.getContext('2d');
   if (!canvas || !ctx) return;


   let animationFrameId: number;
   let obstacleTimer = 0;
   let nextObstacleTime = randomBetween(70, 120);


   function randomBetween(min: number, max: number) {
     return Math.floor(Math.random() * (max - min + 1)) + min;
   }


   const spawnObstacle = () => {
     const type = Math.random();
     let obstacleType: Obstacle['type'];
     let yPos = canvas.height - 140;
     let xPos = canvas.width;


     let size = 140;


     if (type < 0.25) {
       obstacleType = 'rock';
     } else if (type < 0.5) {
       obstacleType = 'monster';
       size = 160;
     } else if (type < 0.75) {
       obstacleType = 'meteor';
     } else {
       obstacleType = 'flame';
       xPos = canvas.width + 100;
       yPos = 0;
     }


     const flameSpeedX = -14;
     const flameSpeedY = 6;


     obstaclesRef.current.push({
       x: xPos,
       y: yPos,
       width: size,
       height: size,
       type: obstacleType,
       vx: obstacleType === 'flame' ? flameSpeedX : undefined,
       vy: obstacleType === 'flame' ? flameSpeedY : undefined,
     });
   };


   const handleAstronaut = () => {
     if (isJumpingRef.current) {
       astronautVelocityRef.current = -jumpForce;
       isJumpingRef.current = false;
     }


     astronautVelocityRef.current += gravity;
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
       if (obs.type === 'flame') {
         obs.x += obs.vx!;
         obs.y += obs.vy!;
       } else {
         obs.x -= baseGameSpeed * gameSpeedMultiplier;
       }


       const image =
         obs.type === 'rock' ? asteroidImg :
         obs.type === 'monster' ? monsterImg :
         obs.type === 'meteor' ? meteorImg :
         flameImg;


       ctx.drawImage(image, obs.x, obs.y, obs.width, obs.height);


       if (obs.x + obs.width < 0 || obs.y > canvas.height) {
         obstaclesRef.current.splice(index, 1);
         scoreRef.current += 1;
       }


       const astronautBox = {
         x: 150 + 40,
         y: astronautYRef.current + 45,
         width: 40,
         height: 40,
       };


       const obstacleBox = {
         x: obs.x + 30,
         y: obs.y + 30,
         width: obs.width - 60,
         height: obs.height - 60,
       };


       if (
         astronautBox.x < obstacleBox.x + obstacleBox.width &&
         astronautBox.x + astronautBox.width > obstacleBox.x &&
         astronautBox.y < obstacleBox.y + obstacleBox.height &&
         astronautBox.y + astronautBox.height > obstacleBox.y
       ) {
         setFinalScore(scoreRef.current);
         setIsGameOver(true);
         showExplosion.current = true;
         explosionRef.current = { x: 150, y: astronautYRef.current };
         explosionTimerRef.current = 30;
       }
     });
   };


   const drawExplosion = () => {
     if (showExplosion.current && explosionRef.current && explosionTimerRef.current > 0) {
       ctx.drawImage(explosionImg, explosionRef.current.x, explosionRef.current.y, 120, 120);
       explosionTimerRef.current -= 1;
       if (explosionTimerRef.current <= 0) {
         showExplosion.current = false;
       }
     }
   };


   const drawScore = () => {
     ctx.fillStyle = 'white';
     ctx.font = '24px Courier New';
     ctx.fillText(`Score: ${scoreRef.current}`, 20, 40);
   };


   const gameLoop = (timestamp: number) => {
     const deltaTime = (timestamp - lastTimestamp) / 1000;
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
         nextObstacleTime = randomBetween(70, 120);
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


   astronautImg.onload = () => {
     backgroundImg.onload = () => {
       gameLoop(0);
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
       backgroundImage: 'url("/space-bg.jpg")',
       backgroundSize: 'cover',
       backgroundPosition: 'center',
       height: '100vh',
       position: 'relative',
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



