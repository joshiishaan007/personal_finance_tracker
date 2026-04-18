export const QUOTES: string[] = [
  'A budget is telling your money where to go instead of wondering where it went. — Dave Ramsey',
  'Do not save what is left after spending; instead spend what is left after saving. — Warren Buffett',
  'An investment in knowledge pays the best interest. — Benjamin Franklin',
  'The stock market is a device for transferring money from the impatient to the patient. — Warren Buffett',
  'Financial freedom is available to those who learn about it and work for it. — Robert Kiyosaki',
  'The habit of saving is itself an education; it fosters every virtue, teaches self-denial. — T.T. Munger',
  'Rich people stay rich by living like they\'re broke. Broke people stay broke by living like they\'re rich.',
  'Wealth is not about having a lot of money; it\'s about having a lot of options. — Chris Rock',
  'It is not your salary that makes you rich, it\'s your spending habits. — Charles A. Jaffe',
  'Money is only a tool. It will take you wherever you wish. — Ayn Rand',
  'Every time you borrow money, you\'re robbing your future self. — Nathan W. Morris',
  'A penny saved is a penny earned. — Benjamin Franklin',
  'Too many people spend money they haven\'t earned to buy things they don\'t want. — Will Rogers',
  'Beware of little expenses. A small leak will sink a great ship. — Benjamin Franklin',
  'The art is not in making money, but in keeping it. — Proverb',
  'You must gain control over your money or the lack of it will forever control you. — Dave Ramsey',
  'The secret to wealth is simple: find a way to do more for others than anyone else does. — Tony Robbins',
  'Wealth consists not in having great possessions, but in having few wants. — Epictetus',
  'The greatest wealth is to live content with little. — Plato',
  'Money grows on the tree of persistence. — Japanese Proverb',
  'Compound interest is the eighth wonder of the world. — Albert Einstein',
  'Never spend your money before you have it. — Thomas Jefferson',
  'Financial peace isn\'t the acquisition of stuff. It\'s learning to live on less. — Dave Ramsey',
  'The quickest way to double your money is to fold it in half and put it in your back pocket. — Will Rogers',
  'Making money is a happiness. Making other people happy is a super-happiness. — Nobel Peace Prize winner',
  'Opportunity is missed by most people because it is dressed in overalls and looks like work. — Thomas Edison',
  'Success is not the key to happiness. Happiness is the key to success. — Albert Schweitzer',
  'Small steps every day. That\'s how the mountain is climbed.',
  'Every financial decision today is a gift or burden to your future self.',
  'Your net worth is not your self worth — but taking care of one helps the other.',
];

export function getDailyQuote(): string {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length] ?? QUOTES[0]!;
}
