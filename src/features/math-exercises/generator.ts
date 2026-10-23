import type {
  MathDifficulty,
  MathExerciseQuestion,
  MathExerciseSetDocument,
  MathExerciseTopicId,
  MathSemester,
} from '../../domain'

export interface MathTopicOption {
  id: MathExerciseTopicId
  label: string
  description: string
  semester: MathSemester
}

export interface GenerateMathExerciseSetOptions {
  semester: MathSemester
  topicId: MathExerciseTopicId
  difficulty: MathDifficulty
  questionCount: number
  usedQuestionSignatures?: Iterable<string>
}

export type MathExerciseSetDraft = Omit<
  MathExerciseSetDocument,
  'createdAt' | 'createdBy' | 'createdByName'
>

export const MATH_SEMESTER_LABELS: Record<MathSemester, string> = {
  semester_1: 'Học kỳ 1',
  semester_2: 'Học kỳ 2',
}

export const MATH_DIFFICULTY_LABELS: Record<MathDifficulty, string> = {
  basic: 'Cơ bản',
  applied: 'Vận dụng',
}

export const MATH_TOPIC_OPTIONS: MathTopicOption[] = [
  {
    id: 'mixed',
    label: 'Tổng hợp học kỳ 1',
    description: 'Kết hợp các dạng số, phép tính và đại lượng của học kỳ 1.',
    semester: 'semester_1',
  },
  {
    id: 'fractions',
    label: 'Ôn tập phân số',
    description: 'Cộng, trừ và rút gọn phân số.',
    semester: 'semester_1',
  },
  {
    id: 'decimal_add_subtract',
    label: 'Cộng, trừ số thập phân',
    description: 'Đặt tính và giải bài toán với số thập phân.',
    semester: 'semester_1',
  },
  {
    id: 'decimal_multiply_divide',
    label: 'Nhân, chia số thập phân',
    description: 'Nhân hoặc chia số thập phân với số tự nhiên.',
    semester: 'semester_1',
  },
  {
    id: 'unit_conversion',
    label: 'Đổi đơn vị đo',
    description: 'Độ dài, khối lượng, diện tích và dung tích.',
    semester: 'semester_1',
  },
  {
    id: 'percentage',
    label: 'Tỉ số phần trăm',
    description: 'Tìm phần trăm của một số và bài toán thực tế.',
    semester: 'semester_1',
  },
  {
    id: 'mixed',
    label: 'Tổng hợp học kỳ 2',
    description: 'Kết hợp hình học, chuyển động và xử lí dữ liệu.',
    semester: 'semester_2',
  },
  {
    id: 'triangle_trapezoid',
    label: 'Tam giác và hình thang',
    description: 'Tính diện tích tam giác và hình thang.',
    semester: 'semester_2',
  },
  {
    id: 'circle',
    label: 'Hình tròn',
    description: 'Tính chu vi và diện tích hình tròn.',
    semester: 'semester_2',
  },
  {
    id: 'solid_geometry',
    label: 'Hình hộp chữ nhật và hình lập phương',
    description: 'Diện tích toàn phần và thể tích.',
    semester: 'semester_2',
  },
  {
    id: 'motion',
    label: 'Chuyển động đều',
    description: 'Quãng đường, vận tốc và thời gian.',
    semester: 'semester_2',
  },
  {
    id: 'statistics',
    label: 'Dữ liệu và số trung bình cộng',
    description: 'Đọc dãy số liệu, tính tổng và số trung bình cộng.',
    semester: 'semester_2',
  },
]

type QuestionDraft = Omit<MathExerciseQuestion, 'id'>
type QuestionGenerator = (difficulty: MathDifficulty) => QuestionDraft

function randomInteger(minimum: number, maximum: number) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum
}

function randomItem<T>(items: readonly T[]) {
  return items[randomInteger(0, items.length - 1)]
}

function shuffle<T>(items: readonly T[]) {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const targetIndex = randomInteger(0, index)
    ;[result[index], result[targetIndex]] = [
      result[targetIndex],
      result[index],
    ]
  }

  return result
}

function roundToDecimalPlaces(value: number, decimalPlaces: number) {
  const factor = 10 ** decimalPlaces

  return Math.round((value + Number.EPSILON) * factor) / factor
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits,
  }).format(roundToDecimalPlaces(value, maximumFractionDigits))
}

function formatScaled(value: number, scale = 100) {
  return formatNumber(value / scale, Math.log10(scale))
}

function greatestCommonDivisor(first: number, second: number): number {
  let left = Math.abs(first)
  let right = Math.abs(second)

  while (right !== 0) {
    ;[left, right] = [right, left % right]
  }

  return left
}

function leastCommonMultiple(first: number, second: number) {
  return (first * second) / greatestCommonDivisor(first, second)
}

function fractionText(numerator: number, denominator: number) {
  if (numerator === 0) return '0'
  if (denominator === 1) return String(numerator)

  return `${numerator}/${denominator}`
}

function simplifyFraction(numerator: number, denominator: number) {
  const divisor = greatestCommonDivisor(numerator, denominator)

  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  }
}

function generateDecimalAddSubtract(
  difficulty: MathDifficulty,
): QuestionDraft {
  const isAddition = Math.random() < 0.5
  const maximum = difficulty === 'basic' ? 12_000 : 60_000
  let first = randomInteger(125, maximum)
  let second = randomInteger(110, maximum)

  if (!isAddition && second > first) {
    ;[first, second] = [second, first]
  }

  const result = isAddition ? first + second : first - second
  const operation = isAddition ? '+' : '−'
  const firstText = formatScaled(first)
  const secondText = formatScaled(second)
  const resultText = formatScaled(result)
  const prompt =
    difficulty === 'basic'
      ? `Đặt tính rồi tính: ${firstText} ${operation} ${secondText}.`
      : isAddition
        ? `Một kho có ${firstText} kg gạo và nhập thêm ${secondText} kg. Hỏi kho có tất cả bao nhiêu ki-lô-gam gạo?`
        : `Một cuộn dây dài ${firstText} m, người ta đã dùng ${secondText} m. Hỏi cuộn dây còn lại bao nhiêu mét?`

  return {
    topicId: 'decimal_add_subtract',
    topicLabel: 'Cộng, trừ số thập phân',
    prompt,
    answer: `${resultText}${difficulty === 'applied' ? (isAddition ? ' kg' : ' m') : ''}`,
    solutionSteps: [
      `Viết các số sao cho các chữ số cùng hàng thẳng cột, đặc biệt là dấu phẩy thẳng nhau.`,
      `Thực hiện phép tính: ${firstText} ${operation} ${secondText} = ${resultText}.`,
      difficulty === 'applied'
        ? `Vậy đáp số là ${resultText}${isAddition ? ' kg' : ' m'}.`
        : `Kết quả của phép tính là ${resultText}.`,
    ],
    signature: `decimal-add-subtract:${isAddition ? 'add' : 'subtract'}:${first}:${second}:${difficulty}`,
  }
}

function generateDecimalMultiplyDivide(
  difficulty: MathDifficulty,
): QuestionDraft {
  const isMultiplication = Math.random() < 0.5
  const naturalNumber = randomInteger(2, difficulty === 'basic' ? 9 : 15)
  const decimalValue = randomInteger(115, difficulty === 'basic' ? 5_000 : 18_000)
  const dividend = decimalValue * naturalNumber
  const decimalText = formatScaled(decimalValue)
  const dividendText = formatScaled(dividend)
  const resultText = isMultiplication
    ? formatScaled(decimalValue * naturalNumber)
    : decimalText
  const prompt =
    difficulty === 'basic'
      ? isMultiplication
        ? `Tính: ${decimalText} × ${naturalNumber}.`
        : `Tính: ${dividendText} : ${naturalNumber}.`
      : isMultiplication
        ? `Mỗi can chứa ${decimalText} lít dầu. Hỏi ${naturalNumber} can như thế chứa bao nhiêu lít dầu?`
        : `Có ${dividendText} kg đường được chia đều vào ${naturalNumber} túi. Hỏi mỗi túi có bao nhiêu ki-lô-gam đường?`

  return {
    topicId: 'decimal_multiply_divide',
    topicLabel: 'Nhân, chia số thập phân',
    prompt,
    answer: `${resultText}${difficulty === 'applied' ? (isMultiplication ? ' lít' : ' kg') : ''}`,
    solutionSteps: isMultiplication
      ? [
          `Ta cần lấy lượng trong một can nhân với số can.`,
          `${decimalText} × ${naturalNumber} = ${resultText}.`,
          `Đáp số: ${resultText}${difficulty === 'applied' ? ' lít' : ''}.`,
        ]
      : [
          `Ta chia tổng khối lượng cho số túi bằng nhau.`,
          `${dividendText} : ${naturalNumber} = ${resultText}.`,
          `Đáp số: ${resultText}${difficulty === 'applied' ? ' kg' : ''}.`,
        ],
    signature: `decimal-multiply-divide:${isMultiplication ? 'multiply' : 'divide'}:${decimalValue}:${naturalNumber}:${difficulty}`,
  }
}

function generateFractions(difficulty: MathDifficulty): QuestionDraft {
  const isAddition = Math.random() < 0.55
  let firstDenominator = randomInteger(3, difficulty === 'basic' ? 10 : 15)
  let secondDenominator = randomInteger(3, difficulty === 'basic' ? 10 : 15)
  let firstNumerator = randomInteger(1, firstDenominator - 1)
  let secondNumerator = randomInteger(1, secondDenominator - 1)

  while (
    !isAddition &&
    firstNumerator * secondDenominator ===
      secondNumerator * firstDenominator
  ) {
    secondDenominator = randomInteger(
      3,
      difficulty === 'basic' ? 10 : 15,
    )
    secondNumerator = randomInteger(1, secondDenominator - 1)
  }

  if (
    !isAddition &&
    firstNumerator / firstDenominator <
      secondNumerator / secondDenominator
  ) {
    ;[firstNumerator, secondNumerator] = [
      secondNumerator,
      firstNumerator,
    ]
    ;[firstDenominator, secondDenominator] = [
      secondDenominator,
      firstDenominator,
    ]
  }

  const commonDenominator = leastCommonMultiple(
    firstDenominator,
    secondDenominator,
  )
  const convertedFirst =
    firstNumerator * (commonDenominator / firstDenominator)
  const convertedSecond =
    secondNumerator * (commonDenominator / secondDenominator)
  const resultNumerator = isAddition
    ? convertedFirst + convertedSecond
    : convertedFirst - convertedSecond
  const simplified = simplifyFraction(
    resultNumerator,
    commonDenominator,
  )
  const firstText = fractionText(firstNumerator, firstDenominator)
  const secondText = fractionText(secondNumerator, secondDenominator)
  const resultText = fractionText(
    simplified.numerator,
    simplified.denominator,
  )
  const operation = isAddition ? '+' : '−'
  const appliedPrompt = isAddition
    ? `Một đoạn dây dài ${firstText} m và đoạn dây thứ hai dài ${secondText} m. Hỏi cả hai đoạn dây dài bao nhiêu mét?`
    : `Đoạn dây thứ nhất dài ${firstText} m, đoạn dây thứ hai dài ${secondText} m. Hỏi đoạn dây thứ nhất dài hơn đoạn dây thứ hai bao nhiêu mét?`

  return {
    topicId: 'fractions',
    topicLabel: 'Ôn tập phân số',
    prompt:
      difficulty === 'basic'
        ? `Tính rồi rút gọn: ${firstText} ${operation} ${secondText}.`
        : appliedPrompt,
    answer: `${resultText}${difficulty === 'applied' ? ' m' : ''}`,
    solutionSteps: [
      `Mẫu số chung nhỏ nhất của ${firstDenominator} và ${secondDenominator} là ${commonDenominator}.`,
      `Quy đồng: ${firstText} = ${convertedFirst}/${commonDenominator}; ${secondText} = ${convertedSecond}/${commonDenominator}.`,
      `${convertedFirst}/${commonDenominator} ${operation} ${convertedSecond}/${commonDenominator} = ${resultNumerator}/${commonDenominator}.`,
      `Rút gọn phân số, ta được ${resultText}${difficulty === 'applied' ? ' m' : ''}.`,
    ],
    signature: `fractions:${isAddition ? 'add' : 'subtract'}:${firstNumerator}:${firstDenominator}:${secondNumerator}:${secondDenominator}:${difficulty}`,
  }
}

const UNIT_CONVERSIONS = [
  { from: 'km', to: 'm', factor: 1_000 },
  { from: 'm', to: 'cm', factor: 100 },
  { from: 'kg', to: 'g', factor: 1_000 },
  { from: 'tấn', to: 'kg', factor: 1_000 },
  { from: 'm²', to: 'dm²', factor: 100 },
  { from: 'lít', to: 'ml', factor: 1_000 },
] as const

function generateUnitConversion(
  difficulty: MathDifficulty,
): QuestionDraft {
  const conversion = randomItem(UNIT_CONVERSIONS)
  const valueTenths = randomInteger(11, difficulty === 'basic' ? 150 : 500)
  const sourceValue = valueTenths / 10
  const result = sourceValue * conversion.factor
  const sourceText = formatNumber(sourceValue, 1)
  const resultText = formatNumber(result)

  return {
    topicId: 'unit_conversion',
    topicLabel: 'Đổi đơn vị đo',
    prompt:
      difficulty === 'basic'
        ? `Đổi ${sourceText} ${conversion.from} sang ${conversion.to}.`
        : `Một đại lượng có giá trị ${sourceText} ${conversion.from}. Hãy viết giá trị đó theo đơn vị ${conversion.to}.`,
    answer: `${resultText} ${conversion.to}`,
    solutionSteps: [
      `Ta có 1 ${conversion.from} = ${formatNumber(conversion.factor)} ${conversion.to}.`,
      `${sourceText} × ${formatNumber(conversion.factor)} = ${resultText}.`,
      `Vậy ${sourceText} ${conversion.from} = ${resultText} ${conversion.to}.`,
    ],
    signature: `unit-conversion:${conversion.from}:${conversion.to}:${valueTenths}:${difficulty}`,
  }
}

function generatePercentage(difficulty: MathDifficulty): QuestionDraft {
  const percentage = randomItem([10, 15, 20, 25, 30, 40, 50, 60, 75])

  if (difficulty === 'applied') {
    const originalPrice = randomInteger(5, 150) * 20_000
    const discount = (originalPrice * percentage) / 100
    const finalPrice = originalPrice - discount

    return {
      topicId: 'percentage',
      topicLabel: 'Tỉ số phần trăm',
      prompt: `Một sản phẩm có giá ${formatNumber(originalPrice)} đồng và được giảm ${percentage}%. Hỏi sau khi giảm, người mua phải trả bao nhiêu tiền?`,
      answer: `${formatNumber(finalPrice)} đồng`,
      solutionSteps: [
        `Số tiền được giảm là: ${formatNumber(originalPrice)} × ${percentage} : 100 = ${formatNumber(discount)} (đồng).`,
        `Số tiền phải trả là: ${formatNumber(originalPrice)} − ${formatNumber(discount)} = ${formatNumber(finalPrice)} (đồng).`,
        `Đáp số: ${formatNumber(finalPrice)} đồng.`,
      ],
      signature: `percentage:discount:${originalPrice}:${percentage}`,
    }
  }

  const whole = randomInteger(2, 150) * 20
  const part = (whole * percentage) / 100

  return {
    topicId: 'percentage',
    topicLabel: 'Tỉ số phần trăm',
    prompt: `Tìm ${percentage}% của ${formatNumber(whole)}.`,
    answer: formatNumber(part),
    solutionSteps: [
      `Muốn tìm ${percentage}% của ${formatNumber(whole)}, ta lấy ${formatNumber(whole)} nhân với ${percentage} rồi chia cho 100.`,
      `${formatNumber(whole)} × ${percentage} : 100 = ${formatNumber(part)}.`,
      `Vậy ${percentage}% của ${formatNumber(whole)} là ${formatNumber(part)}.`,
    ],
    signature: `percentage:find-part:${whole}:${percentage}`,
  }
}

function generateTriangleTrapezoid(
  difficulty: MathDifficulty,
): QuestionDraft {
  const isTriangle = Math.random() < 0.5

  if (isTriangle) {
    const base = randomInteger(2, difficulty === 'basic' ? 15 : 30) * 2
    const height = randomInteger(3, difficulty === 'basic' ? 18 : 35)
    const area = (base * height) / 2

    return {
      topicId: 'triangle_trapezoid',
      topicLabel: 'Tam giác và hình thang',
      prompt: `Một ${difficulty === 'applied' ? 'mảnh đất hình tam giác' : 'hình tam giác'} có đáy ${base} m và chiều cao ${height} m. Tính diện tích ${difficulty === 'applied' ? 'mảnh đất' : 'hình tam giác'} đó.`,
      answer: `${formatNumber(area)} m²`,
      solutionSteps: [
        `Diện tích tam giác bằng độ dài đáy nhân chiều cao rồi chia cho 2.`,
        `${base} × ${height} : 2 = ${formatNumber(area)} (m²).`,
        `Đáp số: ${formatNumber(area)} m².`,
      ],
      signature: `triangle-area:${base}:${height}:${difficulty}`,
    }
  }

  const firstBase = randomInteger(5, difficulty === 'basic' ? 18 : 35)
  const secondBase = firstBase + randomInteger(2, 15)
  const height = randomInteger(2, difficulty === 'basic' ? 10 : 20) * 2
  const area = ((firstBase + secondBase) * height) / 2

  return {
    topicId: 'triangle_trapezoid',
    topicLabel: 'Tam giác và hình thang',
    prompt: `Một ${difficulty === 'applied' ? 'thửa ruộng hình thang' : 'hình thang'} có hai đáy dài ${firstBase} m và ${secondBase} m, chiều cao ${height} m. Tính diện tích ${difficulty === 'applied' ? 'thửa ruộng' : 'hình thang'} đó.`,
    answer: `${formatNumber(area)} m²`,
    solutionSteps: [
      `Diện tích hình thang bằng tổng độ dài hai đáy nhân chiều cao rồi chia cho 2.`,
      `(${firstBase} + ${secondBase}) × ${height} : 2 = ${formatNumber(area)} (m²).`,
      `Đáp số: ${formatNumber(area)} m².`,
    ],
    signature: `trapezoid-area:${firstBase}:${secondBase}:${height}:${difficulty}`,
  }
}

function generateCircle(difficulty: MathDifficulty): QuestionDraft {
  const isArea = Math.random() < 0.5
  const radiusTenths = randomInteger(
    20,
    difficulty === 'basic' ? 400 : 800,
  )
  const radius = radiusTenths / 10
  const result = roundToDecimalPlaces(
    isArea ? 3.14 * radius * radius : 2 * 3.14 * radius,
    4,
  )
  const radiusText = formatNumber(radius, 1)

  return {
    topicId: 'circle',
    topicLabel: 'Hình tròn',
    prompt: `Một ${difficulty === 'applied' ? 'bồn hoa hình tròn' : 'hình tròn'} có bán kính ${radiusText} m. Tính ${isArea ? 'diện tích' : 'chu vi'} của ${difficulty === 'applied' ? 'bồn hoa' : 'hình tròn'} đó (lấy π = 3,14).`,
    answer: `${formatNumber(result, 4)} ${isArea ? 'm²' : 'm'}`,
    solutionSteps: isArea
      ? [
          `Diện tích hình tròn được tính bằng: bán kính × bán kính × 3,14.`,
          `${radiusText} × ${radiusText} × 3,14 = ${formatNumber(result, 4)} (m²).`,
          `Đáp số: ${formatNumber(result, 4)} m².`,
        ]
      : [
          `Chu vi hình tròn được tính bằng: 2 × bán kính × 3,14.`,
          `2 × ${radiusText} × 3,14 = ${formatNumber(result, 4)} (m).`,
          `Đáp số: ${formatNumber(result, 4)} m.`,
        ],
    signature: `circle:${isArea ? 'area' : 'circumference'}:${radiusTenths}:${difficulty}`,
  }
}

function generateSolidGeometry(
  difficulty: MathDifficulty,
): QuestionDraft {
  const isCube = Math.random() < 0.35
  const askVolume = Math.random() < 0.55

  if (isCube) {
    const edge = randomInteger(2, difficulty === 'basic' ? 12 : 24)
    const result = askVolume ? edge ** 3 : 6 * edge ** 2

    return {
      topicId: 'solid_geometry',
      topicLabel: 'Hình hộp chữ nhật và hình lập phương',
      prompt: `Một hình lập phương có cạnh ${edge} cm. Tính ${askVolume ? 'thể tích' : 'diện tích toàn phần'} của hình đó.`,
      answer: `${formatNumber(result)} ${askVolume ? 'cm³' : 'cm²'}`,
      solutionSteps: askVolume
        ? [
            `Thể tích hình lập phương bằng cạnh × cạnh × cạnh.`,
            `${edge} × ${edge} × ${edge} = ${formatNumber(result)} (cm³).`,
            `Đáp số: ${formatNumber(result)} cm³.`,
          ]
        : [
            `Diện tích một mặt là: ${edge} × ${edge} = ${edge ** 2} (cm²).`,
            `Diện tích toàn phần là: ${edge ** 2} × 6 = ${formatNumber(result)} (cm²).`,
            `Đáp số: ${formatNumber(result)} cm².`,
          ],
      signature: `cube:${askVolume ? 'volume' : 'surface'}:${edge}:${difficulty}`,
    }
  }

  const length = randomInteger(5, difficulty === 'basic' ? 20 : 35)
  const width = randomInteger(3, Math.max(4, length - 1))
  const height = randomInteger(2, difficulty === 'basic' ? 12 : 20)
  const result = askVolume
    ? length * width * height
    : 2 * (length * width + length * height + width * height)

  return {
    topicId: 'solid_geometry',
    topicLabel: 'Hình hộp chữ nhật và hình lập phương',
    prompt: `Một ${difficulty === 'applied' ? 'chiếc hộp dạng hình hộp chữ nhật' : 'hình hộp chữ nhật'} có chiều dài ${length} cm, chiều rộng ${width} cm và chiều cao ${height} cm. Tính ${askVolume ? 'thể tích' : 'diện tích toàn phần'} của hình đó.`,
    answer: `${formatNumber(result)} ${askVolume ? 'cm³' : 'cm²'}`,
    solutionSteps: askVolume
      ? [
          `Thể tích hình hộp chữ nhật bằng chiều dài × chiều rộng × chiều cao.`,
          `${length} × ${width} × ${height} = ${formatNumber(result)} (cm³).`,
          `Đáp số: ${formatNumber(result)} cm³.`,
        ]
      : [
          `Tổng diện tích ba mặt khác nhau là: ${length} × ${width} + ${length} × ${height} + ${width} × ${height} = ${formatNumber(result / 2)} (cm²).`,
          `Diện tích toàn phần là: ${formatNumber(result / 2)} × 2 = ${formatNumber(result)} (cm²).`,
          `Đáp số: ${formatNumber(result)} cm².`,
        ],
    signature: `rectangular-prism:${askVolume ? 'volume' : 'surface'}:${length}:${width}:${height}:${difficulty}`,
  }
}

function generateMotion(difficulty: MathDifficulty): QuestionDraft {
  const unknown = randomItem(['distance', 'speed', 'time'] as const)
  const speed = randomInteger(
    difficulty === 'basic' ? 20 : 30,
    difficulty === 'basic' ? 80 : 120,
  )
  const time = randomInteger(1, difficulty === 'basic' ? 8 : 12)
  const distance = speed * time

  if (unknown === 'distance') {
    return {
      topicId: 'motion',
      topicLabel: 'Chuyển động đều',
      prompt: `Một xe đi với vận tốc ${speed} km/giờ trong ${time} giờ. Tính quãng đường xe đi được.`,
      answer: `${distance} km`,
      solutionSteps: [
        `Quãng đường bằng vận tốc nhân với thời gian.`,
        `${speed} × ${time} = ${distance} (km).`,
        `Đáp số: ${distance} km.`,
      ],
      signature: `motion:distance:${speed}:${time}:${difficulty}`,
    }
  }

  if (unknown === 'speed') {
    return {
      topicId: 'motion',
      topicLabel: 'Chuyển động đều',
      prompt: `Một xe đi quãng đường ${distance} km trong ${time} giờ. Tính vận tốc của xe.`,
      answer: `${speed} km/giờ`,
      solutionSteps: [
        `Vận tốc bằng quãng đường chia cho thời gian.`,
        `${distance} : ${time} = ${speed} (km/giờ).`,
        `Đáp số: ${speed} km/giờ.`,
      ],
      signature: `motion:speed:${distance}:${time}:${difficulty}`,
    }
  }

  return {
    topicId: 'motion',
    topicLabel: 'Chuyển động đều',
    prompt: `Một xe đi quãng đường ${distance} km với vận tốc ${speed} km/giờ. Tính thời gian xe đi hết quãng đường đó.`,
    answer: `${time} giờ`,
    solutionSteps: [
      `Thời gian bằng quãng đường chia cho vận tốc.`,
      `${distance} : ${speed} = ${time} (giờ).`,
      `Đáp số: ${time} giờ.`,
    ],
    signature: `motion:time:${distance}:${speed}:${difficulty}`,
  }
}

function generateStatistics(difficulty: MathDifficulty): QuestionDraft {
  const average = randomInteger(
    difficulty === 'basic' ? 8 : 15,
    difficulty === 'basic' ? 60 : 120,
  )
  const maximumSpread = Math.min(
    average - 1,
    difficulty === 'basic' ? 12 : 24,
  )
  const firstSpread = randomInteger(1, maximumSpread)
  let secondSpread = randomInteger(1, maximumSpread)

  while (secondSpread === firstSpread) {
    secondSpread = randomInteger(1, maximumSpread)
  }

  const values = shuffle([
    average - firstSpread,
    average - secondSpread,
    average,
    average + secondSpread,
    average + firstSpread,
  ])
  const total = average * values.length
  const valueText = values.join(', ')

  return {
    topicId: 'statistics',
    topicLabel: 'Dữ liệu và số trung bình cộng',
    prompt:
      difficulty === 'basic'
        ? `Số quyển sách đọc được trong 5 tuần lần lượt là: ${valueText}. Tính tổng số quyển sách.`
        : `Số cây trồng được trong 5 ngày lần lượt là: ${valueText}. Tính số cây trung bình trồng được mỗi ngày.`,
    answer:
      difficulty === 'basic'
        ? `${total} quyển sách`
        : `${average} cây`,
    solutionSteps:
      difficulty === 'basic'
        ? [
            `Cộng năm số liệu đã cho.`,
            `${values.join(' + ')} = ${total}.`,
            `Đáp số: ${total} quyển sách.`,
          ]
        : [
            `Tổng số cây trồng được là: ${values.join(' + ')} = ${total} (cây).`,
            `Số cây trung bình mỗi ngày là: ${total} : 5 = ${average} (cây).`,
            `Đáp số: ${average} cây.`,
          ],
    signature: `statistics:${difficulty}:${[...values].sort((a, b) => a - b).join('-')}`,
  }
}

const QUESTION_GENERATORS: Record<
  Exclude<MathExerciseTopicId, 'mixed'>,
  QuestionGenerator
> = {
  fractions: generateFractions,
  decimal_add_subtract: generateDecimalAddSubtract,
  decimal_multiply_divide: generateDecimalMultiplyDivide,
  unit_conversion: generateUnitConversion,
  percentage: generatePercentage,
  triangle_trapezoid: generateTriangleTrapezoid,
  circle: generateCircle,
  solid_geometry: generateSolidGeometry,
  motion: generateMotion,
  statistics: generateStatistics,
}

function getTopicOption(
  semester: MathSemester,
  topicId: MathExerciseTopicId,
) {
  return MATH_TOPIC_OPTIONS.find(
    (topic) => topic.semester === semester && topic.id === topicId,
  )
}

function availableTopicIds(semester: MathSemester) {
  return MATH_TOPIC_OPTIONS.filter(
    (topic) => topic.semester === semester && topic.id !== 'mixed',
  ).map((topic) => topic.id as Exclude<MathExerciseTopicId, 'mixed'>)
}

export function topicsForSemester(semester: MathSemester) {
  return MATH_TOPIC_OPTIONS.filter(
    (topic) => topic.semester === semester,
  )
}

export function generateMathExerciseSet(
  options: GenerateMathExerciseSetOptions,
): MathExerciseSetDraft {
  const questionCount = Math.min(Math.max(options.questionCount, 1), 15)
  const usedSignatures = new Set(options.usedQuestionSignatures ?? [])
  const selectedSignatures = new Set<string>()
  const questions: MathExerciseQuestion[] = []
  const topicOption = getTopicOption(options.semester, options.topicId)

  if (!topicOption) {
    throw new Error('INVALID_MATH_TOPIC')
  }

  const semesterTopics = availableTopicIds(options.semester)
  const mixedTopicSequence = shuffle(semesterTopics)
  const maximumAttempts = questionCount * 300
  let attempts = 0

  while (questions.length < questionCount && attempts < maximumAttempts) {
    attempts += 1
    const generatedTopic =
      options.topicId === 'mixed'
        ? mixedTopicSequence[
            questions.length % mixedTopicSequence.length
          ]
        : options.topicId
    const generator =
      QUESTION_GENERATORS[
        generatedTopic as Exclude<MathExerciseTopicId, 'mixed'>
      ]
    const question = generator(options.difficulty)

    if (
      usedSignatures.has(question.signature) ||
      selectedSignatures.has(question.signature)
    ) {
      continue
    }

    selectedSignatures.add(question.signature)
    questions.push({
      ...question,
      id: `question-${questions.length + 1}`,
    })
  }

  if (questions.length < questionCount) {
    throw new Error('NOT_ENOUGH_UNIQUE_QUESTIONS')
  }

  const signature = questions
    .map((question) => question.signature)
    .sort()
    .join('|')

  return {
    title: `Đề Toán 5 · ${MATH_SEMESTER_LABELS[options.semester]} · ${topicOption.label}`,
    semester: options.semester,
    topicId: options.topicId,
    topicLabel: topicOption.label,
    difficulty: options.difficulty,
    questionCount,
    questions,
    signature,
  }
}
