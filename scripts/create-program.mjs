import fs from 'node:fs/promises';
const ex = (exercise, region, description, alternative) => ({ exercise, region, description, alternative });
const catalog = {
 incline: ex('Low-incline dumbbell press','upper','Set the bench to 15–30°. Keep feet planted and lower the dumbbells beside your upper chest; press without bouncing.','Incline chest-press machine'),
 row: ex('Chest-supported dumbbell row','upper','Brace your chest on an incline bench. Pull elbows toward your hips and lower without shrugging.','Chest-supported machine row'),
 pull: ex('Neutral-grip lat pulldown','upper','Keep ribs stacked. Pull handles toward your upper chest without leaning back or swinging.','Assisted neutral-grip pull-up'),
 landmine: ex('Half-kneeling landmine press','upper','Secure the bar in a landmine base. Kneel with the working-side knee down; press up and forward without arching. Reps are per side.','Single-arm cable shoulder press'),
 squat: ex('Goblet squat','lower','Hold a dumbbell at your chest. Sit between your hips to a comfortable depth and drive through your whole foot.','Leg press'),
 rdl: ex('Dumbbell Romanian deadlift','lower','Soften your knees and push your hips back. Keep weights close; stop before your back rounds and stand tall.','Cable pull-through'),
 curl: ex('Bayesian cable curl','upper','Face away from a low cable with your elbow slightly behind your torso. Curl without moving the upper arm.','Incline dumbbell curl'),
 tri: ex('Overhead rope triceps extension','upper','Face away from the high cable. Keep upper arms steady and extend your elbows without flaring your ribs.','Rope pushdown'),
 lateral: ex('Cable lateral raise','upper','Raise the arm out to the side to shoulder height; lower slowly without swinging.','Dumbbell lateral raise'),
 rear: ex('Reverse pec deck','upper','Set handles at shoulder height. Open your arms with soft elbows and keep your chest on the pad.','Cable rear-delt fly'),
 flat: ex('Flat dumbbell press','upper','Plant feet and brace your upper back. Lower dumbbells under control and press with wrists over elbows.','Machine chest press'),
 cableRow: ex('Seated cable row','upper','Stay tall with a still torso. Row toward your lower ribs and let shoulder blades move on the return.','Chest-supported row'),
 shoulder: ex('Seated dumbbell shoulder press','upper','Use a supported bench. Press overhead in a comfortable range without arching your lower back.','Machine shoulder press'),
 split: ex('Reverse lunge','lower','Step back and lower both knees under control. Drive through the front foot. Complete the listed reps on each leg.','Supported split squat'),
 legCurl: ex('Seated leg curl','lower','Align your knee with the machine pivot and keep hips against the pad. Curl and return slowly.','Lying leg curl'),
 hammer: ex('Cross-body hammer curl','upper','Keep a neutral grip and curl toward the opposite shoulder without swinging. Reps are per arm.','Rope hammer curl'),
 pushdown: ex('Rope triceps pushdown','upper','Keep elbows by your ribs. Extend fully and return without letting shoulders roll forward.','Straight-bar pushdown'),
 chin: ex('Assisted chin-up','upper','Use enough assistance for controlled reps. Pull your chest toward the bar and lower without swinging.','Supinated lat pulldown'),
 machine: ex('Converging chest press','upper','Set handles around mid-chest. Press while keeping your upper back on the pad.','Flat dumbbell press'),
 tbar: ex('Chest-supported T-bar row','upper','Keep chest supported and pull toward your lower ribs. Pause briefly and lower with control.','Chest-supported dumbbell row'),
 legpress: ex('Leg press','lower','Keep hips on the pad. Lower to a comfortable depth without your pelvis rolling; press without locking knees hard.','Goblet squat'),
 pullthrough: ex('Cable pull-through','lower','Face away from a low pulley with rope between your legs. Hinge back and squeeze glutes to stand without leaning back.','Dumbbell Romanian deadlift'),
 preacher: ex('Machine preacher curl','upper','Keep upper arms on the pad. Curl smoothly and avoid snapping elbows straight at the bottom.','EZ-bar preacher curl'),
 cablepress: ex('Standing single-arm cable press','upper','Use a split stance and keep hips square. Press forward without rotating. Reps are per side.','Single-arm machine chest press'),
 widepull: ex('Medium-grip lat pulldown','upper','Use a comfortable overhand grip. Bring the bar toward upper chest while keeping your torso controlled.','Assisted pull-up'),
 oneRow: ex('Single-arm cable row','upper','Keep hips and ribs square. Pull elbow beside your torso without twisting. Reps are per side.','Bench-supported dumbbell row'),
 smith: ex('Smith machine incline press','upper','Set a low incline and position the bench so the bar meets upper chest. Set safety stops before loading.','Incline dumbbell press'),
 hack: ex('Hack squat','lower','Keep your back on the pad. Descend to a controlled comfortable depth and push through the whole foot.','Leg press'),
 face: ex('Cable face pull','upper','Pull the rope toward eyebrow level with elbows comfortably wide. Avoid shrugging or leaning back.','Reverse pec deck'),
};
// Six upper slots = 16 sets; two lower slots = 4 sets. Lower work uses both knee and hip/hamstring patterns.
const blocks = [
 {phase:'Foundation / fresh angles', a:['incline','row','pull','landmine','squat','rdl','curl','tri'], b:['flat','cableRow','pull','shoulder','split','legCurl','lateral','rear']},
 {phase:'Build / machines + control', a:['machine','chin','tbar','landmine','legpress','pullthrough','preacher','tri'], b:['incline','oneRow','widepull','shoulder','split','legCurl','lateral','face']},
 {phase:'Strength / confident reps', a:['smith','tbar','chin','cablepress','hack','rdl','curl','pushdown'], b:['flat','oneRow','widepull','landmine','squat','legCurl','lateral','rear']},
];
const focuses=['Find your working loads','Add clean reps','Build on your best','Recover + reset'];
const weeks = Array.from({length:12},(_,i)=>{
 const n=i+1, stage=i%4, block=blocks[Math.floor(i/4)], deload=stage===3;
 const days=Object.fromEntries(['a','b'].map((key,d)=>['Day '+(d+1),block[key].map((id,j)=>{
 // Rotate only finishers on alternate build weeks; compound anchors stay measurable.
 if(stage===1 && j>=6) id = key==='a' ? ['hammer','pushdown'][j-6] : ['face','curl'][j-6];
 const lower=j===4||j===5, sets=deload?(j<4?2:1):(j<4?3:2);
 return {...catalog[id],block:j<2?'A'+(j+1):j<4?'B'+(j-1):j<6?'C'+(j-3):'D'+(j-5),sets,reps:lower?'8–10':j<2?(stage===2?'6–8':'8–10'):j<4?'8–12':'12–15',rest:j<2?150:j<4?120:lower?90:60,notes:deload?'Use about 10–15% less load than week '+(n-1)+'. Leave 4 reps in reserve.':j<2?'Straight sets. Complete this exercise before moving on.':j<4?'Alternate B1/B2 only if equipment is free. Rest after each exercise.':lower?'Controlled reps. Rest after each set.':'Optional D1/D2 pairing. No rush; keep form clean.'};
 })]));
 return {weekNumber:n,phase:block.phase,focus:focuses[stage],rir:deload?4:stage===0?3:2,days};
});
const program={title:'FORM / A fresh training cycle',startDate:'2026-10-27',timezone:'Australia/Sydney',weeks,guidance:{schedule:'Two sessions a week, ideally 2–3 days apart. Day 1 and Day 2 are session labels; train on the days that suit you. Allow around 65–80 minutes including warm-up.',warmup:'Start with 5 minutes of easy movement. Do 2–3 progressively heavier warm-up sets for your first press and pull, plus a light rehearsal of your first leg exercise. Warm-up sets do not count toward the totals.',progression:'Keep compound lifts for each four-week block. When every working set reaches the top of its rep range with the target reps in reserve, add the smallest available load next time (usually 2–5%). Otherwise add a rep or repeat the load. Compare matching exercises, not different variations.',effort:'RIR means reps in reserve: how many clean reps you could still do. Most work stops with 2–3 reps left. No forced reps or failure targets. Use a comfortable range and swap an exercise if it causes pain.',variety:'New compound combinations every four weeks. Week 2 of each block rotates finishers; week 3 returns to the original finishers with a lower rep range on the first two lifts. Weeks 4, 8 and 12 reduce volume and effort.',balance:'Regular sessions: 16 upper + 4 lower working sets = 80/20 by direct programmed sets. Recovery sessions: 10 upper + 2 lower sets. Compound exercises also involve other muscles, so this is an emphasis rather than a physiological percentage.',goal:'Build and maintain muscle with repeatable strength work. Visible definition also depends on nutrition and body-fat levels; this cycle does not promise spot fat loss.',core:'Optional: after either session add 2 easy sets of dead bugs or Pallof presses if time allows. These are extra core work and excluded from the 80/20 working-set count.',cycle:'After week 12, review your logged loads and choose a new cycle. The app holds at week 12 rather than silently looping.',sources:[{title:'ACSM 2026 resistance training guidance',url:'https://acsm.org/resistance-training-guidelines-update-2026/'}]}};
await fs.writeFile('program.json',JSON.stringify(program,null,2)+'\n');
const rows=['Week,Day,Block,Exercise,Sets,Reps,Notes'];
for(const w of weeks)for(const [day,entries]of Object.entries(w.days))for(const e of entries)rows.push([w.weekNumber,day,e.block,e.exercise,e.sets,e.reps,e.notes].map(v=>'"'+String(v).replaceAll('"','""')+'"').join(','));
await fs.writeFile('workouts.csv',rows.join('\n')+'\n');
console.log('Created 12 weeks / 24 sessions in program.json and workouts.csv');
