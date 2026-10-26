/**
 * Intelligent Personal Finance Conversational AI Engine
 * Understands arbitrary natural language queries, evaluates financial context,
 * extracts intents, amounts, categories, and generates grounded, accurate responses.
 */

// Format currency with Indian Rupee symbol
export const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

// Common category synonyms mapping to capture natural language references
const CATEGORY_SYNONYMS = {
  food: ['food', 'dining', 'dinner', 'lunch', 'breakfast', 'eat', 'eating', 'groceries', 'grocery', 'meal', 'meals', 'restaurant', 'restaurants', 'snack', 'snacks', 'coffee', 'cafe', 'takeout', 'drinks'],
  transport: ['transport', 'transportation', 'car', 'fuel', 'gas', 'gasoline', 'petrol', 'diesel', 'uber', 'lyft', 'taxi', 'cab', 'bus', 'train', 'metro', 'subway', 'flight', 'parking', 'commute'],
  housing: ['housing', 'rent', 'mortgage', 'apartment', 'house', 'lease', 'room', 'flat', 'property'],
  utilities: ['utility', 'utilities', 'electric', 'electricity', 'water', 'gas bill', 'wifi', 'internet', 'broadband', 'phone bill', 'mobile bill', 'power'],
  entertainment: ['entertainment', 'movie', 'movies', 'cinema', 'games', 'gaming', 'netflix', 'spotify', 'subscription', 'subscriptions', 'concert', 'party', 'fun', 'hobby', 'hobbies'],
  shopping: ['shopping', 'clothes', 'clothing', 'shoes', 'apparel', 'amazon', 'store', 'mall', 'electronics', 'gadgets', 'gear'],
  health: ['health', 'healthcare', 'medical', 'medicine', 'doctor', 'hospital', 'pharmacy', 'fitness', 'gym', 'wellness', 'dental', 'clinic'],
  salary: ['salary', 'paycheck', 'wage', 'wages', 'stipend', 'bonus', 'job', 'work', 'freelance', 'consulting', 'dividend', 'interest']
};

/**
 * Main query processor
 * @param {string} rawQuery - The user's input question
 * @param {Array} transactions - The array of transaction objects
 * @returns {object} { text: string, type: string, suggestions: string[] }
 */
export function processFinancialQuery(rawQuery, transactions = []) {
  if (!rawQuery || typeof rawQuery !== 'string') {
    return {
      text: "Please enter a financial question or select one of the suggestions below.",
      type: 'info',
      suggestions: ["What is my current balance?", "Where am I spending the most?", "How can I save more?"]
    };
  }

  const query = rawQuery.toLowerCase().trim();
  const cleanQuery = query.replace(/[?.,!/\\;:'"()]/g, ' ');

  // Compute key indicators
  const incomeTx = transactions.filter(t => t.type?.toLowerCase() === 'income');
  const expenseTx = transactions.filter(t => t.type?.toLowerCase() === 'expense');

  const totalIncome = incomeTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpense = expenseTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const currentBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((currentBalance / totalIncome) * 100) : 0;

  // Aggregate categories
  const categoryMap = {};
  expenseTx.forEach(t => {
    const cat = (t.category || 'Other').trim();
    categoryMap[cat] = (categoryMap[cat] || 0) + Number(t.amount || 0);
  });

  const rankedCategories = Object.entries(categoryMap)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  // If no transactions exist
  if (transactions.length === 0) {
    if (matchAny(cleanQuery, ['hi', 'hello', 'hey', 'start', 'help', 'who are you'])) {
      return {
        text: `👋 **Hello! I'm your AI Personal Finance Assistant.**\n\nYou haven't recorded any transactions yet. Once you add some income and expenses (or click **"Add Sample Data"** in the Transactions tab), I can:\n\n• Calculate your real-time balance and net savings\n• Analyze your top spending categories\n• Verify if you can afford upcoming purchases\n• Provide personalized budget-saving recommendations`,
        type: 'welcome',
        suggestions: ["Add sample data", "How does this system work?", "What can you do?"]
      };
    }
    return {
      text: `📊 **No transactions found.**\n\nTo give you accurate calculations and insights, please record at least one income or expense in the **Transactions** tab, or load our demo dataset.`,
      type: 'empty',
      suggestions: ["What can you do?", "How do I add a transaction?"]
    };
  }

  // 1. Affordability Check ("Can I afford ₹1,500", "Should I buy a ₹3,000 phone", "Can I spend 500 rupees")
  const affordRegex = /(?:can\s+i\s+(?:afford|buy|spend|purchase)|should\s+i\s+(?:buy|spend)|is\s+it\s+(?:safe|okay|fine)\s+to\s+spend|afford(?:able)?)/;
  if (affordRegex.test(cleanQuery)) {
    const amountMatch = query.match(/[\$₹]?\s*(\d+(?:[.,]\d+)?)/);
    if (amountMatch) {
      const targetAmount = parseFloat(amountMatch[1].replace(',', ''));
      if (!isNaN(targetAmount) && targetAmount > 0) {
        const remainingAfter = currentBalance - targetAmount;
        const newSavingsRate = totalIncome > 0 ? ((remainingAfter / totalIncome) * 100).toFixed(1) : 0;

        if (currentBalance <= 0) {
          return {
            text: `⚠️ **Not Recommended (Overdraft Risk)**\n\nYour current balance is **${formatCurrency(currentBalance)}**. Spending **${formatCurrency(targetAmount)}** would put your finances deeper into the negative (**${formatCurrency(remainingAfter)}**).\n\n💡 *Tip: Consider postponing non-essential purchases until you add more income.*`,
            type: 'warning',
            suggestions: ["What is my current balance?", "Where am I spending the most?", "How can I save more?"]
          };
        } else if (targetAmount > currentBalance) {
          return {
            text: `❌ **No, you cannot safely afford this.**\n\n• **Item Cost:** ${formatCurrency(targetAmount)}\n• **Current Balance:** ${formatCurrency(currentBalance)}\n• **Shortfall:** ${formatCurrency(targetAmount - currentBalance)}\n\nThis purchase exceeds your available funds by **${formatCurrency(targetAmount - currentBalance)}**.`,
            type: 'warning',
            suggestions: ["What is my total income?", "Show me my expenses", "How can I save?"]
          };
        } else {
          const ratio = (targetAmount / currentBalance) * 100;
          let safeAssessment = "";
          if (ratio < 20) {
            safeAssessment = `✅ **Comfortably Affordable:** This takes up only **${ratio.toFixed(1)}%** of your available balance.`;
          } else if (ratio < 50) {
            safeAssessment = `⚠️ **Moderate Impact:** This takes up **${ratio.toFixed(1)}%** of your remaining cash. Ensure you have enough left for upcoming bills.`;
          } else {
            safeAssessment = `🚨 **High Impact:** This purchase consumes **${ratio.toFixed(1)}%** of your remaining balance!`;
          }

          return {
            text: `${safeAssessment}\n\n• **Purchase Cost:** ${formatCurrency(targetAmount)}\n• **Balance Before:** ${formatCurrency(currentBalance)}\n• **Balance After:** ${formatCurrency(remainingAfter)}\n• **Projected Savings Rate:** ${newSavingsRate}%\n\n${remainingAfter > 0 ? "You will still maintain a positive balance." : "You will deplete all your cash reserves."}`,
            type: 'calculation',
            suggestions: ["What is my current balance?", "Give me a financial summary", "Where do I spend most?"]
          };
        }
      }
    }
  }

  // 2. Specific Category Inquiries (e.g. "How much did I spend on food?", "Show my rent expenses", "gas expenses")
  const matchedCategory = findMentionedCategory(cleanQuery, rankedCategories);
  if (matchedCategory) {
    const catItems = expenseTx.filter(t => t.category?.toLowerCase() === matchedCategory.name.toLowerCase());
    const recentCatItems = catItems.slice(-3).reverse().map(t => `• ${t.description || 'Expense'}: **${formatCurrency(t.amount)}** on ${t.date}`).join('\n');

    return {
      text: `🏷️ **Expense Breakdown for "${matchedCategory.name}"**\n\n• **Total Spent:** ${formatCurrency(matchedCategory.amount)}\n• **Share of Total Expenses:** **${matchedCategory.percentage}%**\n• **Transactions Recorded:** ${catItems.length}\n\n**Recent transactions in this category:**\n${recentCatItems || 'None recorded'}\n\n${Number(matchedCategory.percentage) > 30 ? `💡 *Notice: This is one of your heaviest expenditure areas (${matchedCategory.percentage}% of all expenses).*` : ''}`,
      type: 'category',
      suggestions: ["Where am I spending the most?", "What is my total expenses?", "How can I reduce spending?"]
    };
  }

  // 3. Highest / Top Spending Category
  if (matchAny(cleanQuery, ['where am i spending the most', 'where am i spending most', 'where do i spend the most', 'biggest expense', 'highest spending', 'top category', 'top expense', 'major expense', 'largest cost', 'where did my money go', 'what cost the most', 'spending the most', 'spending most', 'highest cost'])) {
    if (rankedCategories.length > 0) {
      const top = rankedCategories[0];
      const topList = rankedCategories.slice(0, 3).map((c, i) => `${i + 1}. **${c.name}**: ${formatCurrency(c.amount)} (${c.percentage}%)`).join('\n');
      return {
        text: `🏆 **Your Highest Spending Category is "${top.name}"**\n\nYou have spent **${formatCurrency(top.amount)}** on **${top.name}**, which represents **${top.percentage}%** of your total expenses (${formatCurrency(totalExpense)}).\n\n**Top 3 Spending Categories:**\n${topList}\n\n💡 *Recommendation: Focusing on cutting 10-15% of your "${top.name}" spending would save you ~${formatCurrency(top.amount * 0.12)} every period!*`,
        type: 'insight',
        suggestions: [`How much did I spend on ${top.name}?`, "How can I save more?", "What is my current balance?"]
      };
    } else {
      return {
        text: `You do not have any recorded expenses yet. Total expenses are currently **₹0.00**.`,
        type: 'info',
        suggestions: ["Add sample data", "What is my total income?"]
      };
    }
  }

  // 4. Lowest / Smallest Spending Category
  if (matchAny(cleanQuery, ['least expense', 'lowest spending', 'least spending', 'smallest expense', 'lowest category', 'where do i spend the least'])) {
    if (rankedCategories.length > 0) {
      const lowest = rankedCategories[rankedCategories.length - 1];
      return {
        text: `📉 **Your Lowest Expense Category is "${lowest.name}"**\n\nYou've spent **${formatCurrency(lowest.amount)}** (**${lowest.percentage}%** of total expenses).`,
        type: 'insight',
        suggestions: ["Where am I spending the most?", "What is my balance?"]
      };
    }
  }

  // 5. Balance / Cash / Net Worth / Remaining Funds
  if (matchAny(cleanQuery, ['balance', 'how much money do i have', 'how much money left', 'how much left', 'remaining money', 'remaining funds', 'what is my balance', 'net cash', 'current balance', 'wallet', 'in my bank', 'cash on hand', 'am i broke', 'what do i have'])) {
    const statusNote = currentBalance >= 0 
      ? `You have a healthy surplus of **${formatCurrency(currentBalance)}**.`
      : `⚠️ You are currently running a deficit of **${formatCurrency(Math.abs(currentBalance))}** (expenses exceed income).`;

    return {
      text: `💵 **Financial Balance Overview**\n\n• **Current Balance:** **${formatCurrency(currentBalance)}**\n• **Total Income:** ${formatCurrency(totalIncome)}\n• **Total Expenses:** ${formatCurrency(totalExpense)}\n• **Net Savings Rate:** ${savingsRate.toFixed(2)}%\n\n${statusNote}`,
      type: 'balance',
      suggestions: ["Where am I spending the most?", "Can I afford ₹1,000?", "Give me a full financial summary"]
    };
  }

  // 6. Total Income / Earnings / Salary
  if (matchAny(cleanQuery, ['income', 'how much did i earn', 'total earned', 'total income', 'how much made', 'salary', 'my earnings', 'revenue', 'money in', 'cash flow in', 'paycheck'])) {
    const recentIncome = incomeTx.slice(-3).reverse().map(t => `• ${t.description || 'Income'}: **${formatCurrency(t.amount)}** (${t.date})`).join('\n');
    return {
      text: `💰 **Total Income Summary**\n\n• **Total Earned:** **${formatCurrency(totalIncome)}** across **${incomeTx.length}** transaction(s).\n• **Average Income Entry:** ${incomeTx.length ? formatCurrency(totalIncome / incomeTx.length) : '₹0.00'}\n\n**Recent Income Entries:**\n${recentIncome || 'No entries yet'}\n\nAfter deducting expenses of **${formatCurrency(totalExpense)}**, your net retained balance is **${formatCurrency(currentBalance)}**.`,
      type: 'income',
      suggestions: ["What are my total expenses?", "What is my savings rate?", "Where am I spending the most?"]
    };
  }

  // 7. Total Expenses / Spending / Bills
  if (matchAny(cleanQuery, ['total expenses', 'total expense', 'total spend', 'total spending', 'how much did i spend', 'how much have i spent', 'how much spent', 'money out', 'bills paid', 'expenditure', 'spending summary'])) {
    const avgExpense = expenseTx.length ? (totalExpense / expenseTx.length) : 0;
    return {
      text: `💳 **Expense Breakdown**\n\n• **Total Spent:** **${formatCurrency(totalExpense)}** across **${expenseTx.length}** transaction(s).\n• **Average Expense:** ${formatCurrency(avgExpense)}\n• **Number of Categories:** ${rankedCategories.length}\n• **Top Category:** ${rankedCategories[0] ? `${rankedCategories[0].name} (${formatCurrency(rankedCategories[0].amount)})` : 'None'}\n\nYour expenses represent **${totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : 100}%** of your total income.`,
      type: 'expense',
      suggestions: ["Where am I spending the most?", "What is my current balance?", "How can I save more?"]
    };
  }

  // 8. Savings Rate & Savings Analysis
  if (matchAny(cleanQuery, ['savings rate', 'how much did i save', 'how much have i saved', 'savings', 'net savings', 'save rate', 'am i saving enough', 'savings percentage'])) {
    let evaluation = "";
    if (savingsRate >= 50) {
      evaluation = "🌟 **Phenomenal Savings Rate!** You are saving more than half your income. This puts you well ahead on the path to financial freedom.";
    } else if (savingsRate >= 20) {
      evaluation = "✅ **Healthy Savings Rate!** Financial experts recommend saving at least 20% of your net income (the 50/30/20 rule). You are meeting this target.";
    } else if (savingsRate > 0) {
      evaluation = "⚠️ **Modest Savings:** You are saving, but less than the recommended 20% baseline. Cutting non-essential subscriptions or dining out can help boost this.";
    } else {
      evaluation = "🚨 **Negative Savings:** Your expenses exceed your income. Immediate adjustments are recommended to prevent debt accumulation.";
    }

    return {
      text: `🏦 **Savings Analysis**\n\n• **Net Savings (Balance):** **${formatCurrency(currentBalance)}**\n• **Savings Rate:** **${savingsRate.toFixed(2)}%**\n• **Target Benchmark:** ≥ 20.00%\n\n${evaluation}`,
      type: 'savings',
      suggestions: ["How can I save more?", "Where am I spending the most?", "Give me a full financial summary"]
    };
  }

  // 9. Financial Advice / How to save more / Budget recommendations
  if (matchAny(cleanQuery, ['how can i save more', 'how to save', 'tips to save', 'budget tips', 'financial advice', 'how do i budget', 'cut costs', 'reduce expenses', 'recommendations', 'improve finances', 'save money'])) {
    const topCat = rankedCategories[0];
    const secondCat = rankedCategories[1];

    let tailoredTips = [];
    if (topCat) {
      tailoredTips.push(`1. **Target Your Largest Expense (${topCat.name})**: It represents ${topCat.percentage}% of your spending (${formatCurrency(topCat.amount)}). Setting a strict budget cap here of ${formatCurrency(topCat.amount * 0.85)} will immediately save you **${formatCurrency(topCat.amount * 0.15)}**.`);
    }
    if (secondCat) {
      tailoredTips.push(`2. **Review ${secondCat.name}**: At ${formatCurrency(secondCat.amount)} (${secondCat.percentage}%), check if any recurring items or impulse purchases can be trimmed.`);
    }
    tailoredTips.push(`3. **Adopt the 50/30/20 Rule**: Allocate 50% of income to Needs, 30% to Wants, and 20% straight to Savings.`);
    tailoredTips.push(`4. **Track Every Micro-transaction**: Frequent small purchases add up rapidly without realizing.`);

    return {
      text: `💡 **Personalized Financial & Budgeting Recommendations**\n\nBased on your current numbers (Income: ${formatCurrency(totalIncome)} | Expenses: ${formatCurrency(totalExpense)}):\n\n${tailoredTips.join('\n\n')}`,
      type: 'advice',
      suggestions: ["What is my savings rate?", "Can I afford ₹2,000?", "Give me a full financial summary"]
    };
  }

  // 10. Financial Health Score / Comprehensive Summary
  if (matchAny(cleanQuery, ['summary', 'financial health', 'overview', 'how am i doing', 'report', 'audit', 'tell me about my finances', 'give me a summary', 'status', 'health score'])) {
    const score = calculateHealthScore(totalIncome, totalExpense, currentBalance, savingsRate);
    const topCatName = rankedCategories[0] ? rankedCategories[0].name : 'N/A';

    return {
      text: `📋 **Executive Financial Health Report**\n\n• **Financial Health Score:** **${score.value}/100** (${score.grade} - ${score.label})\n• **Current Net Balance:** **${formatCurrency(currentBalance)}**\n• **Total Inflow (Income):** ${formatCurrency(totalIncome)}\n• **Total Outflow (Expenses):** ${formatCurrency(totalExpense)}\n• **Current Savings Rate:** ${savingsRate.toFixed(1)}%\n• **Top Cost Driver:** ${topCatName} (${rankedCategories[0] ? formatCurrency(rankedCategories[0].amount) : '₹0'})\n• **Total Transactions Logged:** ${transactions.length}\n\n**Verdict:** ${score.verdict}`,
      type: 'report',
      suggestions: ["Where am I spending the most?", "How can I save more?", "Can I afford ₹1,500?"]
    };
  }

  // 11. Recent Transactions / Last Transaction
  if (matchAny(cleanQuery, ['last transaction', 'recent transaction', 'recent purchases', 'latest expense', 'what did i buy recently', 'latest transactions', 'recent activity', 'history'])) {
    const lastFive = transactions.slice(-5).reverse();
    const list = lastFive.map(t => {
      const sign = t.type === 'income' ? '+' : '-';
      return `• **${t.date}**: ${t.description || 'Item'} (${t.category}) — **${sign}${formatCurrency(t.amount)}**`;
    }).join('\n');

    return {
      text: `🕒 **Last 5 Recorded Transactions:**\n\n${list}\n\nYou have a total of **${transactions.length}** transactions logged in the system.`,
      type: 'recent',
      suggestions: ["What is my current balance?", "Where am I spending the most?", "Largest transaction?"]
    };
  }

  // 12. Largest / Highest Single Transaction
  if (matchAny(cleanQuery, ['largest transaction', 'highest transaction', 'biggest purchase', 'biggest single expense', 'max purchase', 'most expensive thing', 'largest single purchase'])) {
    if (expenseTx.length > 0) {
      const sortedByAmount = [...expenseTx].sort((a, b) => b.amount - a.amount);
      const largest = sortedByAmount[0];
      return {
        text: `💎 **Largest Single Expense**\n\n• **Description:** ${largest.description || 'Expense'}\n• **Amount:** **${formatCurrency(largest.amount)}**\n• **Category:** ${largest.category}\n• **Date:** ${largest.date}\n\nThis single transaction accounted for **${totalExpense > 0 ? ((largest.amount / totalExpense) * 100).toFixed(1) : 0}%** of your total expenses.`,
        type: 'insight',
        suggestions: ["Where am I spending the most?", "What is my total expenses?", "What is my balance?"]
      };
    }
  }

  // 13. Average Spending / Statistics
  if (matchAny(cleanQuery, ['average', 'stats', 'statistics', 'how many transactions', 'count', 'burn rate', 'daily average'])) {
    const avgExpense = expenseTx.length ? (totalExpense / expenseTx.length) : 0;
    const avgIncome = incomeTx.length ? (totalIncome / incomeTx.length) : 0;
    return {
      text: `📊 **Transaction & Activity Statistics**\n\n• **Total Transactions:** ${transactions.length} (${incomeTx.length} income, ${expenseTx.length} expenses)\n• **Average Expense Amount:** ${formatCurrency(avgExpense)}\n• **Average Income Amount:** ${formatCurrency(avgIncome)}\n• **Active Spending Categories:** ${rankedCategories.length}\n• **Expense-to-Income Ratio:** ${totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : '100'}%`,
      type: 'stats',
      suggestions: ["What is my savings rate?", "Where am I spending the most?", "Give me a summary"]
    };
  }

  // 14. Greetings & Conversational
  if (matchAny(cleanQuery, ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings', 'who are you', 'what can you do', 'help', 'assist me'])) {
    return {
      text: `👋 **Hello! I'm your AI Personal Finance Assistant.**\n\nI can analyze your transactions and answer questions naturally. You can ask me things like:\n\n• *"What is my balance right now?"*\n• *"Where am I spending the most?"*\n• *"Can I afford a ₹2,500 purchase?"*\n• *"How much did I spend on Food or Rent?"*\n• *"What is my savings rate and financial score?"*\n• *"How can I save more money?"*\n\nHow can I help you today?`,
      type: 'welcome',
      suggestions: ["What is my current balance?", "Where am I spending the most?", "Give me a financial summary"]
    };
  }

  // 15. Intelligent Context-Grounded Fallback
  // If the query didn't trigger a specific rule, examine tokens to extract relevant data or provide intelligent guidance
  const tokens = cleanQuery.split(/\s+/).filter(Boolean);
  const foundCat = rankedCategories.find(c => tokens.some(tok => c.name.toLowerCase().includes(tok)));

  if (foundCat) {
    return {
      text: `I noticed you're asking about **${foundCat.name}**.\n\nYou have spent **${formatCurrency(foundCat.amount)}** on **${foundCat.name}**, which is **${foundCat.percentage}%** of your total expenses.`,
      type: 'category',
      suggestions: ["Where am I spending the most?", "What is my balance?", "Give me financial advice"]
    };
  }

  return {
    text: `🤖 **Here is a quick snapshot of your finances:**\n\n• **Current Balance:** **${formatCurrency(currentBalance)}**\n• **Total Income:** ${formatCurrency(totalIncome)}\n• **Total Expenses:** ${formatCurrency(totalExpense)}\n• **Savings Rate:** ${savingsRate.toFixed(1)}%\n• **Top Expense Category:** ${rankedCategories[0] ? `${rankedCategories[0].name} (${formatCurrency(rankedCategories[0].amount)})` : 'None'}\n\n*Feel free to ask specific questions like "Can I afford ₹1,500?", "Where do I spend most?", "How much on groceries?", or "How can I save?".*`,
    type: 'fallback',
    suggestions: ["What is my current balance?", "Where am I spending the most?", "Can I afford ₹1,500?", "How can I save more?"]
  };
}

// Helper: match any keyword or phrase
function matchAny(text, patterns) {
  return patterns.some(pattern => {
    if (pattern.includes(' ')) {
      return text.includes(pattern);
    }
    // Match word boundaries for single words to avoid false positive substrings
    const regex = new RegExp(`\\b${pattern}\\b`, 'i');
    return regex.test(text);
  });
}

// Helper: find mentioned category using synonyms or direct category names
function findMentionedCategory(cleanQuery, rankedCategories) {
  // First check active user categories
  for (const cat of rankedCategories) {
    const catNameLower = cat.name.toLowerCase();
    const regex = new RegExp(`\\b${catNameLower}\\b`, 'i');
    if (regex.test(cleanQuery)) {
      return cat;
    }
  }

  // Check synonym map
  for (const [standardCat, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
    const isMentioned = synonyms.some(syn => {
      const regex = new RegExp(`\\b${syn}\\b`, 'i');
      return regex.test(cleanQuery);
    });

    if (isMentioned) {
      // Find matching ranked category
      const match = rankedCategories.find(c => {
        const cLower = c.name.toLowerCase();
        return cLower.includes(standardCat) || synonyms.some(s => cLower.includes(s));
      });
      if (match) return match;
    }
  }

  return null;
}

// Helper: calculate health score
function calculateHealthScore(income, expense, balance, savingsRate) {
  if (income <= 0) {
    return {
      value: 30,
      grade: 'D',
      label: 'Needs Attention',
      verdict: 'No income logged yet. Ensure income sources are recorded to get an accurate rating.'
    };
  }

  let score = 50; // base score

  // Savings rate contribution (up to 40 points)
  if (savingsRate >= 50) score += 40;
  else if (savingsRate >= 30) score += 32;
  else if (savingsRate >= 20) score += 25;
  else if (savingsRate >= 10) score += 15;
  else if (savingsRate > 0) score += 5;
  else score -= 20;

  // Expense-to-income ratio check (up to 10 points)
  const ratio = expense / income;
  if (ratio <= 0.6) score += 10;
  else if (ratio <= 0.8) score += 5;
  else if (ratio > 1.0) score -= 15;

  score = Math.max(10, Math.min(100, Math.round(score)));

  let grade = 'B';
  let label = 'Good';
  let verdict = 'Your finances are well-managed with a consistent surplus.';

  if (score >= 85) {
    grade = 'A+';
    label = 'Excellent';
    verdict = 'Outstanding financial discipline! You are retaining the vast majority of your income.';
  } else if (score >= 70) {
    grade = 'A';
    label = 'Very Good';
    verdict = 'Strong financial health with a solid buffer against unexpected costs.';
  } else if (score >= 50) {
    grade = 'B';
    label = 'Moderate';
    verdict = 'Stable, but building a slightly higher emergency cushion is advised.';
  } else {
    grade = 'C-';
    label = 'Requires Caution';
    verdict = 'Expenses are running close to or exceeding income. Consider trimming discretionary costs.';
  }

  return { value: score, grade, label, verdict };
}
