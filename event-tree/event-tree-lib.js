// Some boilerplate code

function hsv(h, s, v) {
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0:
            (r = v), (g = t), (b = p);
            break;
        case 1:
            (r = q), (g = v), (b = p);
            break;
        case 2:
            (r = p), (g = v), (b = t);
            break;
        case 3:
            (r = p), (g = q), (b = v);
            break;
        case 4:
            (r = t), (g = p), (b = v);
            break;
        case 5:
            (r = v), (g = p), (b = q);
            break;
    }

    return "rgb(" + r * 255 + "," + g * 255 + ", " + b * 255 + ")";
}

var canvas = (window.canvas = {
    elem: document.getElementById("canvas"),

    resize: function () {
        this.width = this.elem.width = this.elem.offsetWidth;
        this.height = this.elem.height = this.elem.offsetHeight;
        this.centerX = this.width * 0.5;
        this.centerY = this.height * 0.5;
    },
});

canvas.resize();
window.addEventListener("resize", canvas.resize.bind(canvas), false);

/// boilerplate over

const nodeRadius = 40;
const ballRadius = 20;
const nodeColor = hsv(0.6, 1, 0.8);
const ballColor = "red";
const pathColor = "black";
const nodeLineWidth = 5;
const pathWidth = 15;

// Tree data structures

function connectNodes(parent, children, chance) {
    parent.children = children;
    children.forEach((child) => {
        child.parent = parent;
    });
    if (chance) parent.chance = chance;
}

function splitNode(node, chance, distance = 90) {
    node.value = undefined;
    node.outcome = undefined;
    const left = { x: node.x - distance, y: node.y + 120 };
    const right = { x: node.x + distance, y: node.y + 120 };
    connectNodes(node, [left, right], chance);
    nodes.push(left, right);
    return [left, right];
}

// Center root node horizontally and place it a bit down from the top vertically
const startNode = { x: canvas.width / 2, y: 50 };
const rootNode = { x: startNode.x, y: startNode.y + 120 };
connectNodes(startNode, [rootNode]);
let nodes = [rootNode];
// Calculate child nodes' positions based on the root node's position
// splitNode(rootNode, 50, 120).forEach((node) => splitNode(node, 50));
const nodes2 = splitNode(rootNode, 90, 120);

let actions = ["Take a car trip?", "Crash?"];
let rows = [120, 240, 360];

const safeArrive = nodes2[0];
safeArrive.value = "good";
safeArrive.outcome = "You arrive safely at your destination.";
let injured = nodes2[1];
injured.value = "bad";
injured.outcome = "You crash and are injured.";

const ballSpeed = 3;
let balls = [];

function getProbability(node) {
    const parent = node.parent;
    if (parent === startNode) {
        return 1;
    }
    const firstChild = parent.children[0];
    const probability =
        (node === firstChild ? parent.chance : 100 - parent.chance) / 100;
    return probability * getProbability(node.parent);
}

function adjustNodePositions(node, row) {
    if (!node.children) {
        node.y = rows[rows.length - 1];
        return;
    }
    node.y = rows[row];
    node.children.forEach((child) => {
        adjustNodePositions(child, row + 1);
    });
}

adjustNodePositions(startNode, 0);

// Rendering

function drawArrow(ctx, node, chance, pointingLeft) {
    const size = Math.sqrt(chance) * 3 + 8;
    const thickness = pointingLeft ? -size : size;
    const halfThickness = thickness / 2;
    const fromX = pointingLeft
        ? node.x - nodeRadius - 10
        : node.x + nodeRadius + 10;
    const toX = fromX + thickness * 2.5;
    const textPosition = pointingLeft
        ? node.x - nodeRadius - 10 - size * 0.1
        : node.x + nodeRadius + 10 + size * 0.1;

    ctx.fillStyle = "black";
    ctx.textAlign = pointingLeft ? "right" : "left";
    ctx.textBaseline = "middle";
    ctx.font = `${size * 0.9}px sans-serif`;
    ctx.beginPath();

    ctx.moveTo(fromX, node.y - halfThickness); // Move to the top-left point of the line
    ctx.lineTo(toX - thickness, node.y - halfThickness); // Top horizontal line
    ctx.lineTo(toX - thickness, node.y - thickness); // Right vertical line up
    ctx.lineTo(toX, node.y); // Diagonal to arrow tip
    ctx.lineTo(toX - thickness, node.y + thickness); // Left vertical line down
    ctx.lineTo(toX - thickness, node.y + halfThickness); // Bottom horizontal line
    ctx.lineTo(fromX, node.y + halfThickness); // Back to start point to complete the outline

    ctx.closePath(); // Close the path to complete the outline
    ctx.lineWidth = 2; // Set line width for the outline
    ctx.strokeStyle = "#000"; // Set stroke color
    ctx.stroke(); // Draw the outline of the arrow

    ctx.fillText(`${chance}%`, textPosition, node.y);
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    var words = text.split(" ");
    var line = "";

    for (var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + " ";
        var metrics = context.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + " ";
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}

function drawNode(ctx, node) {
    ctx.fillStyle = node.value
        ? node.value === "good"
            ? "green"
            : node.value === "ok"
            ? "yellow"
            : "red"
        : nodeColor;
    ctx.lineWidth = nodeLineWidth;
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    if (node.chance) {
        const chanceL = Math.round(node.chance);
        const chanceR = 100 - chanceL;
        drawArrow(ctx, node, chanceL, true);
        drawArrow(ctx, node, chanceR, false);
    } else {
        // value nodes
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (node.count !== undefined) {
            ctx.font = "48px sans-serif";
            ctx.fillText(node.count, node.x, node.y);
        }
        const probability = (getProbability(node) * 100).toFixed(2) + "%";
        ctx.font = "20px sans-serif";
        ctx.fillText(probability, node.x, node.y + nodeRadius + 20);
        // ctx.fillText(node.outcome, node.x, node.y + nodeRadius * 2 + 20, 200);
        wrapText(
            ctx,
            node.outcome,
            node.x,
            node.y + nodeRadius * 2 + 20,
            160,
            30
        );
    }
}

function drawStartNode(ctx, node) {
    ctx.fillStyle = nodeColor;
    ctx.lineWidth = nodeLineWidth;
    ctx.beginPath();
    const size = 70;
    const width = size * 2;
    const height = size;
    ctx.rect(node.x - width / 2, node.y - height / 2, width, height);
    ctx.fillStyle = "green";
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "white";
    ctx.font = "48px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GO!", node.x, node.y);
}

function drawPath(ctx, start, end) {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
}

function drawTree(ctx) {
    ctx.lineWidth = pathWidth;
    // Connect the root node with child nodes

    const nodeStack = [startNode];
    while (nodeStack.length) {
        parent = nodeStack.pop();
        if (!parent) {
            break;
        }
        if (!parent.children) {
            continue;
        }
        parent.children.forEach((child) => {
            drawPath(ctx, parent, child);
            nodeStack.push(child);
        });
    }

    // Draw the root node
    drawStartNode(ctx, startNode);

    nodes.forEach((node) => drawNode(ctx, node));

    for (let i = 0; i < actions.length; i++) {
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "right";
        ctx.font = "24px sans-serif";
        ctx.fillText(actions[i], 250, rows[i]);
    }
}

function drawBall(ctx, ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ballRadius, 0, 2 * Math.PI);
    ctx.fillStyle = ballColor;
    ctx.fill();
    ctx.stroke();
}

let dragging = null;
let dragStartX = null;

canvas.elem.addEventListener("click", function (event) {
    // Check if the click is within the root node's circle
    if (isMouseOverNode(event, startNode)) {
        balls.push({ node: rootNode, progress: 0 });
    }
});

canvas.elem.addEventListener("mousedown", (e) => {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.chance) {
            if (isMouseOverNode(event, node)) {
                dragging = node;
                dragStartX = e.clientX;
                break;
            }
        }
    }
});

canvas.elem.addEventListener("mousemove", (e) => {
    if (dragging) {
        const mouseX = e.clientX;
        const dragDistance = mouseX - dragStartX;
        const minPercent = 1;

        // Adjust the 'chance' based on the drag direction
        dragging.chance -= dragDistance * 0.5; // Adjust sensitivity as needed
        dragging.chance = Math.max(
            minPercent,
            Math.min(100 - minPercent, dragging.chance)
        );
        dragStartX = mouseX; // Update dragStartX to the current position for continuous adjustment
        return;
    }
    canvas.elem.style.cursor = "default";
    if (isMouseOverNode(event, startNode)) {
        canvas.elem.style.cursor = "pointer";
    } else {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.chance) {
                if (isMouseOverNode(event, node)) {
                    canvas.elem.style.cursor = "ew-resize";
                    break;
                }
            }
        }
    }
});

window.addEventListener("mouseup", () => {
    if (dragging) {
        dragging.chance = Math.round(dragging.chance);
        dragging = null;
    }
});

function isMouseOverNode(event, node) {
    const rect = canvas.elem.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    if (
        Math.abs(mouseX - node.x) > nodeRadius ||
        Math.abs(mouseY - node.y) > nodeRadius
    ) {
        return false;
    }
    const distance = Math.sqrt((mouseX - node.x) ** 2 + (mouseY - node.y) ** 2);
    return distance <= nodeRadius;
}

~(function step() {
    // updating
    for (let i = 0; i < balls.length; i++) {
        const ball = balls[i];
        if (ball.progress < 1) {
            const parent = ball.node.parent;
            const child = ball.node;
            const distance = child.y - parent.y;
            ball.progress += ballSpeed / distance;
            ball.x = parent.x + (child.x - parent.x) * ball.progress;
            ball.y = parent.y + (child.y - parent.y) * ball.progress;
        } else {
            ball.x = ball.node.x;
            ball.y = ball.node.y;
            if (ball.node.children) {
                ball.progress = 0;
                if (ball.node.children.length === 2) {
                    ball.node =
                        ball.node.children[
                            Math.random() < ball.node.chance / 100 ? 0 : 1
                        ];
                } else ball.node = ball.node.children[0];
            } else {
                if (!ball.node.count) ball.node.count = 0;
                ball.node.count += 1;
                balls.splice(i, 1);
            }
        }
    }

    // drawing
    let ctx = canvas.elem.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTree(ctx);
    balls.forEach((ball) => drawBall(ctx, ball));

    requestAnimationFrame(step);
})();
