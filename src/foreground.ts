


namespace Algorithms {


    export namespace DamerauLevenshtein {

        const initMatrix = (s1: any, s2: any) => {
            /* istanbul ignore next */
            if (undefined == s1 || undefined == s2) {
                return null;
            }

            let d: number[][] = [];
            for (let i = 0; i <= s1.length; i++) {
                d[i] = [];
                d[i][0] = i;
            }
            for (let j = 0; j <= s2.length; j++) {
                d[0][j] = j;
            }

            return d;
        };

        const damerau = (i: any, j: any, s1: any, s2: any, d: any, cost: any) => {
            if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
                d[i][j] = Math.min.apply(null, [d[i][j], d[i - 2][j - 2] + cost]);
            }
        };

        export const distance = (string1: string, string2: string) => {
            if (
                undefined == string1 ||
                undefined == string2 ||
                "string" !== typeof string1 ||
                "string" !== typeof string2
            ) {
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
                    } else {
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

        export const distanceAsync = (s1: any, s2: any) =>
            new Promise((resolve, reject) => {
                let result = distance(s1, s2);
                if (0 <= result) {
                    resolve(result);
                } else {
                    reject(result);
                }
            });

        export const minDistanceAsync = (s1: any, list: any) =>
            new Promise((resolve, reject) => {
                if (undefined == list || !Array.isArray(list)) {
                    reject(-1);
                    return;
                } else if (0 === list.length) {
                    resolve(distance(s1, ""));
                    return;
                }

                let min = -2;

                list.forEach((s2) => {
                    let d = distance(s1, s2);
                    if (-2 === min || d < min) {
                        min = d;
                    }
                });

                if (0 <= min) {
                    resolve(min);
                } else {
                    reject(min);
                }
            });
    }

}

namespace Main {

    const caseInsensitive = true;

    export type Distance = {
        original: string,
        findWord: string,
        distance: number
    };

    export const splitter = {
        splitChars: [' ', '\n', '\r'],

        [Symbol.split](string: string, limit: number) {
            let result = string.split(this.splitChars[0]);

            for (let i = 1; i < result.length; i++) {
                result = result.flatMap(word => word.split(this.splitChars[i]));
            }

            return result;
        }
    }

    export const find = (findWords: string[], documentText: string, options: { maxDistance: number }): Distance[] => {
        const documentWords = documentText.split(splitter);
        const distances: Distance[] = [];

        for (const findWord of findWords) {

            if (findWord === '')
                continue;

            const wordsCount = findWord.split(' ').length;

            for (let i = 0; i < documentWords.length; i += wordsCount) {
                const words: string[] = [];
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
    }
}

namespace Hightlight {

    const highlightBackgroundColor = 'lightcoral';
    const highlightFontColor = 'black';

    function getDirectText(element: HTMLElement | Element): string {
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

    export const highlight = (distances: Main.Distance[]) => {

        clearHighlights();

        for (const distance of distances) {

            highlightOne(distance);
        }
    }

    const clearHighlights = () => {
        const elements = Array.from(document.querySelectorAll('.smart-search__highlight')).map(x => <HTMLElement>x);
        for (const element of elements) {
            const text = element.innerText;
            element.replaceWith(document.createTextNode(text))
        }

    }

    const highlightOne = (distance: Main.Distance) => {

        if (!distance.original)
            return;

        const elements = Array.from(document.body.querySelectorAll('*'));
        for (const element of elements) {

            const nodeText = getDirectText(element);

            if (distance.original.length > 0 && nodeText?.length === 0)
                continue;

            const match = nodeText.match(new RegExp(distance.original, 'gi'));

            if (match && match.length > 0) {
                const htmlElement = <HTMLElement>element;
                const innerHtml = htmlElement.innerHTML;

                const span = createHighlightSpan(match[0]).outerHTML;

                htmlElement.innerHTML = innerHtml.replace(match[0], span);
            }
        }
    }

    const createHighlightSpan = (content: string): HTMLSpanElement => {
        const span = document.createElement('span');
        span.classList.add('smart-search__highlight')
        span.style.backgroundColor = highlightBackgroundColor;
        span.style.color = highlightFontColor;
        span.innerText = content;
        return span;
    }
}

namespace Utils {
    export function debounce(func: any, timeout = 300) {
        let timer: number;
        return (...args: any[]) => {
            clearTimeout(timer);
            //@ts-ignore
            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }

}

namespace Popup {
    export const createPopup = () => {
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

        const rangeValue = document.createElement('span')
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
            rangeValue.textContent = (<HTMLInputElement>e.target).value;
        });

        floatingDiv.addEventListener('mousedown', (e) => {
            if ((e.target as HTMLElement).tagName === 'INPUT') return; // не перетаскивать, если клик по input
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
    }
}

document.addEventListener('keydown', (e) => {

    if (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === 'f' || e.key.toLowerCase() === 'а')) {
        console.log('Smart search is started');

        Popup.createPopup();
    }
});

console.log('Smart search is ready');