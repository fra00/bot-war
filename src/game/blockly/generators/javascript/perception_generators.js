import { javascriptGenerator, Order } from "blockly/javascript";

export const perceptionGenerators = {
  is_enemy_visible: function (block) {
    const code = "!!api.scan()";
    return [code, Order.LOGICAL_NOT];
  },
  context_battery_percent: function (block) {
    const code = "context.batteryPercent";
    return [code, Order.MEMBER];
  },
  get_enemy_distance: function (block) {
    const code = `(function() {
      const enemy = api.scan();
      if (enemy) {
        const dx = context.bot.x - enemy.x;
        const dy = context.bot.y - enemy.y;
        return Math.sqrt(dx * dx + dy * dy);
      }
      return -1;
    })()`;
    return [code, Order.FUNCTION_CALL];
  },
  get_enemy_angle: function (block) {
    // const code = `(function() {
    //   const enemy = api.scan();
    //   if (enemy) {
    //     const dx = enemy.x - context.bot.x;
    //     const dy = enemy.y - context.bot.y;
    //     const targetAngle = Math.atan2(dy, dx) * 180 / Math.PI;
    //     let relativeAngle = targetAngle - context.bot.angle;

    //     // Normalizza l'angolo tra -180 e 180
    //     while (relativeAngle > 180) relativeAngle -= 360;
    //     while (relativeAngle <= -180) relativeAngle += 360;

    //     return relativeAngle;
    //   }
    //   return 0;
    // })()`;
    const code = `api.scan().angle`;
    return [code, Order.MEMBER];
  },
  was_hit: function (block) {
    const code = `api.getEvents().some(e => e.type === 'HIT_BY_PROJECTILE')`;
    return [code, Order.FUNCTION_CALL];
  },
  is_turret_aligned: function (block) {
    const code = `(function() {
      const enemy = api.scan();
      if (enemy) {
        const dx = enemy.x - context.bot.x;
        const dy = enemy.y - context.bot.y;
        // Angolo assoluto verso il nemico in gradi
        const targetAngle = Math.atan2(dy, dx) * 180 / Math.PI;

        // Normalizza entrambi gli angoli a [0, 360) per un confronto sicuro
        const normalizedTurretAngle = (context.bot.turretAngle % 360 + 360) % 360;
        const normalizedTargetAngle = (targetAngle % 360 + 360) % 360;

        const angleDiff = Math.abs(normalizedTurretAngle - normalizedTargetAngle);
        const shortestAngleDiff = Math.min(angleDiff, 360 - angleDiff);

        // Considera allineato se la differenza è meno di 1 grado
        return shortestAngleDiff < 1;
      }
      return true; // Se non c'è nemico, non c'è un target, quindi è "allineata"
    })()`;
    return [code, Order.FUNCTION_CALL];
  },
  context_is_moving: function (block) {
    const code = "context.bot.isMoving";
    return [code, Order.MEMBER];
  },
  context_can_fire: function (block) {
    const code = "context.bot.canFire";
    return [code, Order.MEMBER];
  },
  get_arena_width: function (block) {
    const code = "api.getArenaDimensions().width";
    return [code, Order.MEMBER];
  },
  get_arena_height: function (block) {
    const code = "api.getArenaDimensions().height";
    return [code, Order.MEMBER];
  },
  is_projectile_incoming: function (block) {
    const code = "api.scanForIncomingProjectiles().length > 0";
    return [code, Order.RELATIONAL];
  },
  is_wall_collision: function (block) {
    const code = `api.getEvents().some(e => e.type === 'COLLISION_WITH_WALL')`;
    return [code, Order.FUNCTION_CALL];
  },
  api_is_queue_empty: function (block) {
    const code = "api.isQueueEmpty()";
    return [code, Order.FUNCTION_CALL];
  },
  api_is_obstacle_ahead: function (block) {
    const code = "api.isObstacleAhead()";
    return [code, Order.FUNCTION_CALL];
  },
  api_is_position_valid: function (block, generator) {
    const position =
      generator.valueToCode(block, "POSITION", Order.ATOMIC) || "null";
    const code = `api.isPositionValid(${position})`;
    return [code, Order.FUNCTION_CALL];
  },
  api_get_state: function (block) {
    const code = "api.getState()";
    return [code, Order.FUNCTION_CALL];
  },
  api_get_random_point: function (block) {
    const code = "api.getRandomPoint()";
    return [code, Order.FUNCTION_CALL];
  },
  api_is_line_of_sight_clear: function (block, generator) {
    const position =
      generator.valueToCode(block, "POSITION", Order.ATOMIC) || "null";
    const code = `api.isLineOfSightClear(${position})`;
    return [code, Order.FUNCTION_CALL];
  },
  api_scan_obstacles: function (block) {
    const code = "api.scanObstacles()";
    return [code, Order.FUNCTION_CALL];
  },
  api_get_events: function (block) {
    const code = "api.getEvents()";
    return [code, Order.FUNCTION_CALL];
  },
  api_get_orbiting_position: function (block, generator) {
    const targetPoint =
      generator.valueToCode(block, "TARGET_POINT", Order.ATOMIC) || "null";
    const distance =
      generator.valueToCode(block, "DISTANCE", Order.ATOMIC) || "150";
    const direction =
      generator.valueToCode(block, "DIRECTION", Order.ATOMIC) || "'random'";
    const code = `api.getOrbitingPosition(${targetPoint}, ${distance}, ${direction})`;
    return [code, Order.FUNCTION_CALL];
  },
};
