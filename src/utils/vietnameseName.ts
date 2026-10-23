const vietnameseNameCollator = new Intl.Collator('vi', {
  sensitivity: 'base',
  numeric: true,
})

function getVietnameseNameParts(fullName: string) {
  return fullName.trim().split(/\s+/).filter(Boolean).reverse()
}

/**
 * Sắp xếp theo tên gọi (từ cuối), rồi đến tên đệm và họ theo cách dùng
 * phổ biến tại Việt Nam.
 */
export function compareVietnameseNames(
  firstName: string,
  secondName: string,
) {
  const firstParts = getVietnameseNameParts(firstName)
  const secondParts = getVietnameseNameParts(secondName)
  const longestLength = Math.max(firstParts.length, secondParts.length)

  for (let index = 0; index < longestLength; index += 1) {
    const comparison = vietnameseNameCollator.compare(
      firstParts[index] ?? '',
      secondParts[index] ?? '',
    )

    if (comparison !== 0) return comparison
  }

  return 0
}
