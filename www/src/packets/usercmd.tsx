import {UserCmd} from "../parser";
import React from "react";

enum Button {
    ATTACK = (1 << 0),
    JUMP = (1 << 1),
    DUCK = (1 << 2),
    FORWARD = (1 << 3),
    BACK = (1 << 4),
    USE = (1 << 5),
    CANCEL = (1 << 6),
    LEFT = (1 << 7),
    RIGHT = (1 << 8),
    MOVELEFT = (1 << 9),
    MOVERIGHT = (1 << 10),
    ATTACK2 = (1 << 11),
    RUN = (1 << 12),
    RELOAD = (1 << 13),
    ALT1 = (1 << 14),
    ALT2 = (1 << 15),
    SCORE = (1 << 16),
    SPEED = (1 << 17),
    WALK = (1 << 18),
    ZOOM = (1 << 19),
    WEAPON1 = (1 << 20),
    WEAPON2 = (1 << 21),
    BULLRUSH = (1 << 22),
    GRENADE1 = (1 << 23),
    GRENADE2 = (1 << 24),
    ATTACK3 = (1 << 25),
}
namespace Button {
    export function toValues(n: Button) {
        const values: string[] = [];
        while (n) {
            const bit = n & (~n+1);
            values.push(Button[bit]);
            n ^= bit;
        }
        return values;
    }
}

export function UserCmdDetails({cmd}: { cmd: UserCmd }) {
    let out = `${cmd.command_number} - tick ${cmd.tick_count}: `;

    const formatOptionNum = (x: number | null) => x === null ? 0 : x;
    const anyNonNull = (xs: (number | null)[]) => xs.findIndex(x => x !== null) != -1;

    let parts = [];

    if (anyNonNull(cmd.view_angles)) {
        parts.push(`view angles: ${cmd.view_angles.map(formatOptionNum).join(',')}`);
    }
    if (anyNonNull(cmd.movement)) {
        parts.push(`movement: ${cmd.movement.map(formatOptionNum).join(',')}`);
    }
    if (cmd.mouse_dx !== null || cmd.mouse_dy !== null) {
        parts.push(`mouse: ${[cmd.mouse_dx, cmd.mouse_dy].map(formatOptionNum).join(',')}`);
    }
    if (cmd.impulse) {
        parts.push(`impulse ${cmd.impulse}`)
    }
    if (cmd.buttons) {
        parts.push(`buttons ${Button.toValues(cmd.buttons as Button)}`)
    }
    if (cmd.weapon_select) {
        parts.push(`weapon ${cmd.weapon_select.select}(${cmd.weapon_select.subtype})`)
    }
    if (parts.length == 0) {
        parts.push(`no data`)
    }

    return <>{out + parts.join(', ')}</>
}