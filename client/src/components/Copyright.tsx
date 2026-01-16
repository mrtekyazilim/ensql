export function Copyright() {
  const currentYear = new Date().getFullYear()

  return (
    <div className="text-center py-4 text-sm text-gray-600 dark:text-gray-400">
      <p>
        © {currentYear} EnSQL Herhakkı saklıdır.
      </p>
      <p className="mt-1">
        Developed by{' '}
        <a
          href="https://mrtek.com.tr"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium underline"
        >
          Mr.TEK Yazılım Evi
        </a>
      </p>
    </div>
  )
}
