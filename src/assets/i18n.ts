let usedTranslations: Record<string, Record<string, string>> = {}

export const addTranslations = (
  translations: Record<string, Record<string, string>>,
) => {
  usedTranslations = { ...usedTranslations, ...translations }
}

const stringifyDictionary = (dictionary: Record<string, string>) => {
  return Object.entries(dictionary)
    .map(([key, value]) => {
      return `[${key}]
string="${value}"

`
    })
    .join('')
}

export const exportTranslations = (outputDir: string) => {
  const translations = Object.entries(usedTranslations).reduce(
    (translations, [key, valuesByLanguage]) => {
      Object.entries(valuesByLanguage).forEach(([language, value]) => {
        if (!translations[language]) {
          translations[language] = {}
        }
        translations[language][key] = value
      })

      return translations
    },
    {} as Record<string, Record<string, string>>,
  )

  return Object.entries(translations).reduce((acc, [language, dictionary]) => {
    const content = stringifyDictionary(dictionary)
    if (content.length) {
      const filename = `${outputDir}/localisation/xtext_${language}_002_arx-level-generator.ini`
      acc[filename] = content
    }
    return acc
  }, {} as Record<string, string>)
}
