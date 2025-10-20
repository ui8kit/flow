export const flowConfig = {
  "id": "zxTP2RwfuBz1lXA6",
  "name": "Smart Supervisor Content Creation Assistant with Multi-Agent Monitoring",
  "models": [
    {
      "id": "23e1cfb5-6272-44c6-8f00-9a9046b16f15",
      "provider": "openai",
      "model": "gpt-4.1-mini"
    },
    {
      "id": "3a8ae122-d35f-4f6c-bf9e-feae6d183881",
      "provider": "openai",
      "model": "gpt-4.1-mini"
    },
    {
      "id": "e4d74f20-70bf-4a6f-a4ef-1dc581cb30cb",
      "provider": "openai",
      "model": "gpt-4.1-mini"
    },
    {
      "id": "524793ef-cbfc-4e49-8239-3c4e948a6ed8",
      "provider": "openai",
      "model": "gpt-4.1-mini"
    },
    {
      "id": "2ded66ca-1148-4420-a849-be6769a92206",
      "provider": "openai",
      "model": "gpt-4.1-mini"
    },
    {
      "id": "f5760e6e-5489-4ca4-808d-87be68fb0d1b",
      "provider": "openai",
      "model": "gpt-4.1-mini"
    }
  ],
  "agents": [
    {
      "id": "ac32c8d9-507e-4bd6-ad2a-cda3ce61e5d2",
      "name": "Supervisor Agent",
      "role": "supervisor",
      "modelRef": "23e1cfb5-6272-44c6-8f00-9a9046b16f15",
      "tools": [
        "fd6b4d07-1161-482e-8e29-bdd16efe82f7",
        "50599365-9318-409f-bb40-20d6ade1662c",
        "a547b07f-17f8-466e-be93-b737fc963161",
        "259e04f2-2bbf-48b7-a614-69e012e28ff3"
      ],
      "system": "You are a smart supervisor assistant that can communicate on various topics and answer questions. You have access to two specialized agents:\n\n1. Observer Agent - Monitors conversation topics and identifies when users want to create content (articles, social media posts, etc.). It captures the essence of the conversation to determine content creation intent.\n\n2. Content Creation Agent - Handles all content creation tasks once the Observer identifies the intent. This agent has access to specialized tools for internet search, image generation, and article planning.\n\nYour role is to:\n- Engage naturally in conversations on any topic\n- Use the Observer Agent to monitor for content creation intent\n- Delegate to the Content Creation Agent when content needs to be created\n- Provide helpful, accurate responses to user questions"
    }
  ],
  "tools": [
    {
      "id": "fd6b4d07-1161-482e-8e29-bdd16efe82f7",
      "name": "Chat Trigger",
      "description": "Tool generated from n8n node"
    },
    {
      "id": "50599365-9318-409f-bb40-20d6ade1662c",
      "name": "Conversation Memory",
      "description": "Tool generated from n8n node"
    },
    {
      "id": "a547b07f-17f8-466e-be93-b737fc963161",
      "name": "Observer Agent Tool",
      "description": "Monitors the conversation to identify when the user wants to create content of any type (articles, social media posts, blog posts, etc.). Returns true if content creation intent is detected, false otherwise."
    },
    {
      "id": "259e04f2-2bbf-48b7-a614-69e012e28ff3",
      "name": "Content Creation Agent Tool",
      "description": "Creates content of any type (articles, social media posts, blogs, etc.) using specialized sub-agents for internet search, image generation, and article planning."
    },
    {
      "id": "64b0c089-c197-4337-bb8c-e1bb1a53fda1",
      "name": "Internet Search Agent Tool",
      "description": "Searches the internet for information on any topic. Provide a search query and get relevant results."
    },
    {
      "id": "b570055d-6530-45fa-bf7a-1700cbef31e6",
      "name": "Search API Tool",
      "description": "Tool generated from n8n node"
    },
    {
      "id": "85aa81d8-5a01-4608-8fb6-e02312b5f456",
      "name": "Image Creation Agent Tool",
      "description": "Generates images using AI based on text descriptions. Provide a detailed description of the image you want to create."
    },
    {
      "id": "cf3d068d-11bc-4c73-9ef2-2d4676b59d3e",
      "name": "Image Generation API Tool",
      "description": "Tool generated from n8n node"
    },
    {
      "id": "e4d01cd0-c95d-4375-a927-8933463d94bc",
      "name": "Article Planning Agent Tool",
      "description": "Creates structured outlines and plans for articles and long-form content. Provide the topic and get a detailed content plan."
    }
  ]
} as const;
