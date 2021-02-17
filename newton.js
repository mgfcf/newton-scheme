const POINTS_HEADER_X = "x"
const POINTS_HEADER_F = "f(x)"
const POINTS_TABLE_MARGIN = 1
const POINTS_TABLE_H_SEP = '═'
const POINTS_TABLE_X_SEP = '╬'
const POINTS_TABLE_V_SEP = '║'

class Newton {
    constructor(support_points) {
        this.support_points = support_points
        this.nevait = new NevAit(support_points)
        if (typeof(support_points[0].x == 'undefined')) {
            // Map tuples to object points
            this.support_points = this.support_points.map(tuple => {return {x: new Fraction(tuple[0]), y: new Fraction(tuple[1])}})
        } else {
            this.support_points = this.support_points.map(tuple => {return {x: new Fraction(tuple.x), y: new Fraction(tuple.y)}})
        }
        this.div_diff_list = [[]]
        this.factors_list = []
        this.number_space = 1   // Space that will be available for a single number without destroying the output string
        this.formular_space = 25
    }

    div_diff(k, l) {
        if (k == l) {
            return this.support_points[k].y
        }

        // Create row in div_diff_list if not existing
        if (this.div_diff_list[k] === undefined) {
            this.div_diff_list[k] = []
        }

        // Calculate the divided difference if it has not been yet
        if (this.div_diff_list[k][l] === undefined) {
            // Fetch xk and xl
            const xk = this.support_points[k].x
            const xl = this.support_points[l].x

            // Calculate divided difference
            this.div_diff_list[k][l] = this.div_diff(k + 1, l).sub(this.div_diff(k, l - 1)).div(xl.sub(xk))
        }

        return this.div_diff_list[k][l]
    }

    evaluate(x) {
        const k = new Fraction(0)
        const l = new Fraction(this.support_points.length - 1)

        // Reset div_diff_list
        this.div_diff_list = [[]]

        this.div_diff(k, l)
        this.calcFactors()

        return this.nevait.evaluate(x)
    }

    calcFactors() {
        this.factors_list = []

        for (let l = 0; l < this.support_points.length; l++) {
            this.factors_list.push(this.div_diff(0,l))
        }
    }

    getPointTableHeader() {
        let header = this.getPointsTableEntry(POINTS_HEADER_X, POINTS_HEADER_F)
        const row_length = header.length

        header += "\n"
        const space_length = (row_length - 1) / 2

        header += POINTS_TABLE_H_SEP.repeat(space_length) + POINTS_TABLE_X_SEP + POINTS_TABLE_H_SEP.repeat(space_length)
        return header + "\n"
    }

    getPointTableCellWidth() {
        return Math.max(this.number_space,
                        POINTS_HEADER_F.length,
                        POINTS_HEADER_X.length);
    }

    getLineHeight() {
        return 1
    }

    getPointsTableRow(r) {
        if (r % 2 == 0) {
            const index = Math.floor(r / 2)
            return this.getPointsTableEntry(this.support_points[index].x, this.support_points[index].y)
        } else {
            return this.getPointsTableEntry()
        }
    }

    getPointsTableEntry(a = "", b = "") {
        a = a.toString().padStart(this.getPointTableCellWidth(), " ");
        b = b.toString().padStart(this.getPointTableCellWidth(), " ");

        let margin = ""
        if (POINTS_TABLE_MARGIN > 0) {
            margin = " ".repeat(POINTS_TABLE_MARGIN)
        }

        return margin + a + margin + POINTS_TABLE_V_SEP + margin + b + margin
    }

    getNewtonRow(r) {
        let k = Math.floor((r - 1) / 2)
        const max_param = this.support_points.length - 1

        if (k < 0 || max_param * 2 == r) {
            return "";
        }

        let l = k + 1
        let result = "";
        if (r % 2 == 0) {
            l = k + 2
            result += " ".repeat(this.getNewtonDivDiffLength())
        }

        while (k >= 0 && l <= max_param) {
            result += this.getNewtonDivDiff(k, l).padEnd(this.getNewtonDivDiffLength(), " ")
            result += " ".repeat(this.getNewtonDivDiffLength())

            k -= 1
            l += 1
        }

        return result.trimEnd()
    }

    getNewtonDivDiffLength() {
        return this.formular_space
    }

    getNewtonDivDiff(k, l) {
        const xk = this.support_points[k].x
        const xl = this.support_points[l].x
        const numerator = `${this.printFrac(this.div_diff(k + 1, l))} - ${this.printFrac(this.div_diff(k, l - 1))}`
        const denumerator = `${this.printFrac(xl)}-${this.printFrac(xk)}`
        return `(${numerator}) / (${denumerator}) = ${this.printFrac(this.div_diff(k, l), false)}`
    }

    printFrac(x, negativeBrackets = true) {
        var output = x.toFraction()
        if (negativeBrackets && x["s"] < 0) {
            output = `(${output})`
        }
        
        return output
    }

    getNewtonFunc(n) {
        if (n == 0) {
            return ""
        }

        var result = ""

        for (let i = 0; i < n; i++) {
            result += `(x-${this.printFrac(this.support_points[i].x)})`
        }

        return result
    }

    toString(x) {
        var y = this.evaluate(x)
        x = new Fraction(x)
        let result = this.getPointTableHeader()

        // Row count:
        // 2 * #SupportPoints so that there is a row for every suppport point and a row inbetween
        // - 1 Remove last and empty row
        const row_count = 2 * this.support_points.length - 1

        // Generate row by row
        for (let row = 0; row < row_count; row++) {
            result += this.getPointsTableRow(row)
            result += " "
            result += this.getNewtonRow(row)
            result += "\n"
        }

        // Print factors
        result += "\n\n"
        for (let l = 0; l < this.factors_list.length; l++) {
            result += `a<sub>${l}</sub> = ${this.printFrac(this.factors_list[l], false)}`
            result += "\n"
        }

        // Print polynom
        result += "\n\nP(x) = "
        for (let l = 0; l < this.factors_list.length; l++) {
            var a = this.factors_list[l]
            if (l != 0) {
                result += " "
            }
            if (l != 0 && a["s"] >= 0) {
                result += "+"
            }
            result += this.printFrac(a, false) + this.getNewtonFunc(l)
        }

        // Print evaluation
        result += "\n\n"
        result += `P(${this.printFrac(x, false)}) = ${this.printFrac(y, false)}`

        return result
    }
}
