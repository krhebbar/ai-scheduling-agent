# AI Scheduling Agent - Interactive Demo

## 🎯 Try It Now!

We've created **two interactive demos** to showcase the AI Scheduling Agent powered by the **OpenAI Agents JS SDK**.

### 🖥️ CLI Demo (Terminal)

Interactive command-line chat with the scheduling agent.

```bash
cd demo
npm install
export OPENAI_API_KEY=your-api-key
npm run cli
```

**Features:**
- Quick and lightweight
- Pre-defined example prompts (1-5)
- Perfect for testing and development

### 🌐 Web Demo (Browser)

Beautiful chat UI with real-time responses.

```bash
cd demo
npm install
export OPENAI_API_KEY=your-api-key
npm run web
```

Then open: **http://localhost:3001**

**Features:**
- Modern chat interface
- Typing indicators
- Example prompt chips
- Mobile-responsive design

---

## 📸 Screenshots

### Web Demo
![Web Chat Interface](demo/screenshots/web-demo.png)

The web demo provides a clean, modern chat interface with:
- Real-time message streaming
- Typing indicators
- Quick example prompts
- Beautiful gradient design

### CLI Demo
```
🤖 AI Scheduling Agent - CLI Demo
================================================

💡 Try these example prompts:

   1. Schedule a technical interview with Alice next Tuesday at 2pm
   2. What times are available for interviews next week?
   ...

You: 1

Agent: I'd be happy to help you schedule a technical interview...
```

---

## 🚀 Example Conversations

### Example 1: Schedule an Interview

**You:** "Schedule a technical interview with Alice next Tuesday at 2pm"

**Agent:** "I'd be happy to help you schedule a technical interview with Alice for next Tuesday at 2pm. Let me check availability and set that up for you. I'll need to:

1. Confirm Alice's availability for next Tuesday at 2pm
2. Set up the interview session
3. Send calendar invites

Would you like me to proceed with booking this time slot?"

### Example 2: Check Availability

**You:** "What times are available for interviews next week?"

**Agent:** "I can help you check availability for next week. To find the best time slots, I'll need a few details:

1. Which days work best for you? (Monday-Friday)
2. Preferred time range? (Morning, afternoon, or specific hours)
3. How many interviewers will be needed?
4. Interview duration? (typically 30, 45, or 60 minutes)

Let me know your preferences and I'll show you available options!"

### Example 3: Reschedule

**You:** "Reschedule to Wednesday"

**Agent:** "I can help you reschedule to Wednesday. To process this change:

1. Which interview would you like to reschedule?
2. What time on Wednesday works best?

Once you provide these details, I'll check availability and make the change."

---

## 🎨 Technology Stack

The demos showcase:

- **OpenAI Agents JS SDK** - Agent orchestration and tool calling
- **TypeScript** - Type-safe code
- **Express.js** - Web server (web demo)
- **Modern HTML/CSS** - Beautiful UI
- **Readline** - Interactive CLI

---

## 📚 Learn More

- [Demo Setup Instructions](demo/README.md)
- [OpenAI Agents JS SDK](https://github.com/openai/openai-agents-js)
- [Migration Documentation](MIGRATION.md)
- [Main Documentation](README.md)

---

## 🤝 Contributing

Want to improve the demos? Contributions are welcome!

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Submit a pull request

---

## 📝 License

MIT - See [LICENSE](LICENSE) file
