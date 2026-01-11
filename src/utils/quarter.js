/**
 * Get the start and end dates for a given quarter and year
 * @param {number} quarter - Quarter number (1-4)
 * @param {number} year - Year (e.g., 2024)
 * @returns {Object} Object with startDate and endDate as ISO strings
 */
export const getQuarterDates = (quarter, year) => {
  const quarterMonths = {
    1: { start: 0, end: 2 },   // Q1: Jan (0) to Mar (2)
    2: { start: 3, end: 5 },   // Q2: Apr (3) to Jun (5)
    3: { start: 6, end: 8 },   // Q3: Jul (6) to Sep (8)
    4: { start: 9, end: 11 },  // Q4: Oct (9) to Dec (11)
  }

  const { start, end } = quarterMonths[quarter]
  
  // Start date: First day of the first month of the quarter
  const startDate = new Date(year, start, 1)
  
  // End date: Last day of the last month of the quarter
  const endDate = new Date(year, end + 1, 0) // Day 0 of next month = last day of current month
  endDate.setHours(23, 59, 59, 999)

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  }
}

/**
 * Get the current quarter (1-4)
 * @returns {number} Current quarter number
 */
export const getCurrentQuarter = () => {
  const month = new Date().getMonth() // 0-11
  if (month >= 0 && month <= 2) return 1   // Jan-Mar
  if (month >= 3 && month <= 5) return 2   // Apr-Jun
  if (month >= 6 && month <= 8) return 3   // Jul-Sep
  return 4 // Oct-Dec
}

/**
 * Get the current year
 * @returns {number} Current year
 */
export const getCurrentYear = () => {
  return new Date().getFullYear()
}

/**
 * Generate list of years for dropdown (current year and past years)
 * @param {number} yearsBack - Number of past years to include (default: 5)
 * @returns {number[]} Array of years
 */
export const getYearOptions = (yearsBack = 5) => {
  const currentYear = getCurrentYear()
  const years = []
  for (let i = 0; i <= yearsBack; i++) {
    years.push(currentYear - i)
  }
  return years
}

/**
 * Format date range for display
 * @param {string} startDate - Start date ISO string
 * @param {string} endDate - End date ISO string
 * @returns {string} Formatted date range string
 */
export const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }
  
  return `${formatDate(start)} - ${formatDate(end)}`
}

