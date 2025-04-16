"use strict";
var Algorithms;
(function (Algorithms) {
    let DamerauLevenshtein;
    (function (DamerauLevenshtein) {
        const initMatrix = (s1, s2) => {
            /* istanbul ignore next */
            if (undefined == s1 || undefined == s2) {
                return null;
            }
            let d = [];
            for (let i = 0; i <= s1.length; i++) {
                d[i] = [];
                d[i][0] = i;
            }
            for (let j = 0; j <= s2.length; j++) {
                d[0][j] = j;
            }
            return d;
        };
        const damerau = (i, j, s1, s2, d, cost) => {
            if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
                d[i][j] = Math.min.apply(null, [d[i][j], d[i - 2][j - 2] + cost]);
            }
        };
        DamerauLevenshtein.distance = (string1, string2) => {
            if (undefined == string1 ||
                undefined == string2 ||
                "string" !== typeof string1 ||
                "string" !== typeof string2) {
                return -1;
            }
            let d = initMatrix(string1, string2);
            /* istanbul ignore next */
            if (null === d) {
                return -1;
            }
            for (var i = 1; i <= string1.length; i++) {
                let cost;
                for (let j = 1; j <= string2.length; j++) {
                    if (string1.charAt(i - 1) === string2.charAt(j - 1)) {
                        cost = 0;
                    }
                    else {
                        cost = 1;
                    }
                    d[i][j] = Math.min.apply(null, [
                        d[i - 1][j] + 1,
                        d[i][j - 1] + 1,
                        d[i - 1][j - 1] + cost,
                    ]);
                    damerau(i, j, string1, string2, d, cost);
                }
            }
            return d[string1.length][string2.length];
        };
        DamerauLevenshtein.distanceAsync = (s1, s2) => new Promise((resolve, reject) => {
            let result = DamerauLevenshtein.distance(s1, s2);
            if (0 <= result) {
                resolve(result);
            }
            else {
                reject(result);
            }
        });
        DamerauLevenshtein.minDistanceAsync = (s1, list) => new Promise((resolve, reject) => {
            if (undefined == list || !Array.isArray(list)) {
                reject(-1);
                return;
            }
            else if (0 === list.length) {
                resolve(DamerauLevenshtein.distance(s1, ""));
                return;
            }
            let min = -2;
            list.forEach((s2) => {
                let d = DamerauLevenshtein.distance(s1, s2);
                if (-2 === min || d < min) {
                    min = d;
                }
            });
            if (0 <= min) {
                resolve(min);
            }
            else {
                reject(min);
            }
        });
    })(DamerauLevenshtein = Algorithms.DamerauLevenshtein || (Algorithms.DamerauLevenshtein = {}));
})(Algorithms || (Algorithms = {}));
var Main;
(function (Main) {
    const caseInsensitive = true;
    Main.splitter = {
        splitChars: [' ', '\n', '\r'],
        [Symbol.split](string, limit) {
            let result = string.split(this.splitChars[0]);
            for (let i = 1; i < result.length; i++) {
                result = result.flatMap(word => word.split(this.splitChars[i]));
            }
            return result;
        }
    };
    Main.find = (findWords, documentText, options) => {
        const documentWords = documentText.split(Main.splitter);
        const distances = [];
        for (const findWord of findWords) {
            if (findWord === '')
                continue;
            const wordsCount = findWord.split(' ').length;
            for (let i = 0; i < documentWords.length; i += wordsCount) {
                const words = [];
                for (let j = 0; j < wordsCount; j++) {
                    words.push(documentWords[i + j]);
                }
                const totalWord = words.join(' ');
                const totalWordCased = caseInsensitive ? totalWord.toLowerCase() : totalWord;
                const findWordCased = caseInsensitive ? findWord.toLowerCase() : findWord;
                if (totalWordCased === findWordCased)
                    distances.push({ original: totalWord, findWord: findWord, distance: 0 });
                else {
                    const distance = Algorithms.DamerauLevenshtein.distance(totalWordCased, findWordCased);
                    distances.push({ original: totalWord, findWord: findWord, distance: distance });
                }
            }
        }
        const appropriateDistances = distances.filter(x => x.distance <= options.maxDistance);
        return appropriateDistances;
    };
})(Main || (Main = {}));
var Hightlight;
(function (Hightlight) {
    const highlightBackgroundColor = 'lightcoral';
    const highlightFontColor = 'black';
    function getDirectText(element) {
        let text = '';
        if (element.childNodes.length === 0)
            return text;
        const childElements = Array.from(element.childNodes);
        for (let node of childElements) {
            if (node && node.nodeType && node.nodeType === Node.TEXT_NODE) {
                text += node.textContent;
            }
        }
        return text.trim();
    }
    Hightlight.highlight = (distances) => {
        clearHighlights();
        for (const distance of distances) {
            highlightOne(distance);
        }
    };
    const clearHighlights = () => {
        const elements = Array.from(document.querySelectorAll('.smart-search__highlight')).map(x => x);
        for (const element of elements) {
            const text = element.innerText;
            element.replaceWith(document.createTextNode(text));
        }
    };
    const highlightOne = (distance) => {
        if (!distance.original)
            return;
        const elements = Array.from(document.body.querySelectorAll('*'));
        for (const element of elements) {
            const nodeText = getDirectText(element);
            if (distance.original.length > 0 && nodeText?.length === 0)
                continue;
            const match = nodeText.match(new RegExp(distance.original, 'gi'));
            if (match && match.length > 0) {
                const htmlElement = element;
                const innerHtml = htmlElement.innerHTML;
                const span = createHighlightSpan(match[0]).outerHTML;
                htmlElement.innerHTML = innerHtml.replace(match[0], span);
            }
        }
    };
    const createHighlightSpan = (content) => {
        const span = document.createElement('span');
        span.classList.add('smart-search__highlight');
        span.style.backgroundColor = highlightBackgroundColor;
        span.style.color = highlightFontColor;
        span.innerText = content;
        return span;
    };
})(Hightlight || (Hightlight = {}));
var Utils;
(function (Utils) {
    function debounce(func, timeout = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            //@ts-ignore
            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }
    Utils.debounce = debounce;
})(Utils || (Utils = {}));
var Popup;
(function (Popup) {
    Popup.createPopup = () => {
        // Создание стилей для контейнера
        const style = document.createElement('style');
        style.innerHTML = `
                #floating-box {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background-color: white;
                    border: 1px solid #ccc;
                    padding: 10px;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.2);
                    cursor: move;
                    z-index: 9999;
                    width: 200px;
                }

                #floating-box input[type="text"] {
                    width: 100%;
                    margin-top: 5px;
                }

                #floating-box input[type="range"] {
                    width: 80%;
                    margin-top: 5px;
                }

                .range-container {
                    display: flex;
                    align-items: center;
                    gap: 2px;
                }

                .range-value {

                }
                `;
        document.head.appendChild(style);
        // Создание самого div-элемента
        const floatingDiv = document.createElement('div');
        floatingDiv.id = 'floating-box';
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Введите текст';
        input.id = 'smart-input';
        floatingDiv.appendChild(input);
        const range = document.createElement('input');
        range.type = 'range';
        range.min = '0';
        range.max = '15';
        range.step = '1';
        range.value = '3';
        range.id = 'smart-range';
        const rangeValue = document.createElement('span');
        rangeValue.classList.add('range-value');
        rangeValue.textContent = '3';
        const rangeDiv = document.createElement('div');
        rangeDiv.classList.add('range-container');
        rangeDiv.appendChild(range);
        rangeDiv.appendChild(rangeValue);
        floatingDiv.appendChild(rangeDiv);
        document.body.appendChild(floatingDiv);
        // Логика перетаскивания
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;
        const processInput = Utils.debounce(() => {
            const findWords = [input.value];
            const distances = Main.find(findWords, document.body.innerText, { maxDistance: Number(range.value) });
            Hightlight.highlight(distances);
            console.log('Smart search is finished');
        }, 1000);
        input.addEventListener('input', (ev) => {
            processInput();
        });
        range.addEventListener('input', (e) => {
            rangeValue.textContent = e.target.value;
        });
        floatingDiv.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'INPUT')
                return; // не перетаскивать, если клик по input
            isDragging = true;
            offsetX = e.clientX - floatingDiv.getBoundingClientRect().left;
            offsetY = e.clientY - floatingDiv.getBoundingClientRect().top;
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging)
                return;
            floatingDiv.style.left = `${e.clientX - offsetX}px`;
            floatingDiv.style.top = `${e.clientY - offsetY}px`;
            floatingDiv.style.right = 'auto'; // отключаем right, чтобы работал left
        });
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    };
})(Popup || (Popup = {}));
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === 'f' || e.key.toLowerCase() === 'а')) {
        console.log('Smart search is started');
        Popup.createPopup();
    }
});
console.log('Smart search is ready');
