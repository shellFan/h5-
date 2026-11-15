// Boss abilities are part of an active encounter, never a second pacing wave.
var V42BossController = {
    update:function(e,dt,squad,manager,effects) {
        var fraction=Math.max(0,e.hp/e.maxHp), final=e.artStyle==='overlord';
        var phase=final?(fraction<=.33?3:fraction<=.66?2:1):(fraction<=.5?2:1);
        if(e.phaseIndex!==phase) {
            e.phaseIndex=phase;
            e.abilityTimer=.1;e.pendingAttack=null;e.chargeT=0;
            if(final&&phase>1)e.shieldT=0;
            effects.floatText(e.x,2.6,e.z,final?'核心阶段 '+phase:(phase===1?'领主出现':'强化阶段'),phase===3?'#ff666c':'#cb95ff',true);
            effects.shockwave(e.x,.04,e.z,phase===3?0xff5a65:0x9b78ff);
        }
        e.shieldT=Math.max(0,(e.shieldT||0)-dt);
        e.abilityTimer=(e.abilityTimer===undefined?3.5:e.abilityTimer)-dt;
        if(e.pendingAttack) {
            e.pendingAttack.t-=dt;e.chargeT=Math.min(1,1-e.pendingAttack.t/.95);
            if(e.pendingAttack.t<=0) {
                var a=e.pendingAttack;e.pendingAttack=null;e.chargeT=0;e.attackT=1;
                effects.shockwave(a.x,.06,a.z,e.phaseIndex>=3?0xff535f:0xffbe55);
                effects.burst(a.x,.3,a.z,0xffc558,12,3,.5);
                if(Math.abs(squad.x-a.x)<1.0&&Math.abs(squad.z-a.z)<1.6)squad.killSoldiers(final?7:3,effects);
            }
        }
        if(e.abilityTimer>0||e.pendingAttack)return;
        e.abilityTimer=final?(phase===3?2.6:4.4):(phase===2?3.8:5.0);
        var kind=e.artStyle;
        if(kind==='bulwark'||(final&&phase===1)) {
            e.shieldT=1.7;e.attackT=.7;
            effects.shockwave(e.x,.05,e.z,0x70d9ff);
        } else if(kind==='spitking') {
            e.chargeT=.8;
            for(var i=-1;i<=1;i++)manager.spawnSpit(e.x+i*.55,1.0,e.z,squad);
            effects.burst(e.x,1.1,e.z,0x9eff7b,6,2,.4);
        } else if(kind==='hivelord'||(final&&phase===2)) {
            var cap=Math.min(2,Math.max(0,24-manager.aliveCount)); // V5.1.3: 召唤压力再下调(Boss磨损5/s→3.75/s)
            for(var j=0;j<cap;j++)manager.spawnEnemy(j%2?'fast':'split',e.x+(j-1.5)*.65,e.z-2,phase===2?8:5);
            effects.shockwave(e.x,.05,e.z,0xbe79ff);
        } else {
            e.pendingAttack={t:.95,x:squad.x,z:squad.z};e.chargeT=0;
            effects.shockwave(squad.x,.045,squad.z,0xff616b);
            effects.floatText(squad.x,1.3,squad.z,'闪避冲击!','#ffb06c',false);
        }
    }
};
