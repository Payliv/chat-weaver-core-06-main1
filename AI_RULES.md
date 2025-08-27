# AI Application Development Rules

This document outlines the core technologies and best practices for developing features within this application.

## Tech Stack Overview

Our application is built on a modern and robust stack to ensure performance, scalability, and a great developer experience:

*   **React & TypeScript:** For building dynamic and type-safe user interfaces.
*   **Vite:** As our lightning-fast build tool and development server.
*   **Tailwind CSS:** For utility-first styling, enabling rapid and consistent UI development.
*   **shadcn/ui:** A collection of beautifully designed and accessible UI components built with Radix UI and Tailwind CSS.
*   **React Router:** For declarative routing within the single-page application.
*   **Supabase:** Our backend-as-a-service for authentication, database, and storage.
*   **React Query:** For efficient server state management, caching, and data synchronization.
*   **Monaco Editor:** An in-browser code editor, used for interactive coding features.
*   **Lucide React:** A comprehensive icon library for clear visual communication.
*   **AI Services:** Integration with various AI providers (OpenAI, Claude, Gemini, DeepSeek, OpenRouter, KlingAI) through a unified service layer.

## Library Usage Rules

To maintain consistency, performance, and ease of maintenance, please adhere to the following rules when choosing libraries for specific functionalities:

*   **UI Components:**
    *   **Primary Choice:** Always use components from `shadcn/ui`.
    *   **Customization:** If a `shadcn/ui` component doesn't meet specific needs, create a new component in `src/components/` that wraps or extends the existing `shadcn/ui` component, or build a new one from scratch using Radix UI primitives and Tailwind CSS.
*   **Styling:**
    *   **Exclusive:** Use Tailwind CSS exclusively for all styling.
    *   **Avoid:** Do not use inline styles or separate `.css` files for component-specific styles unless absolutely necessary (e.g., for complex animations or third-party library overrides that cannot be achieved with Tailwind). In such cases, ensure styles are scoped and minimal.
*   **Routing:**
    *   **Library:** Use `react-router-dom`.
    *   **Location:** All main application routes should be defined in `src/App.tsx`.
*   **Server State Management:**
    *   **Library:** Use `@tanstack/react-query` for all data fetching, caching, and synchronization with the backend.
*   **Client State Management:**
    *   **Local State:** For simple component-level state, use React's `useState` and `useReducer` hooks.
    *   **Global State:** For global client-side state, consider the React Context API for small to medium-sized applications. Avoid over-engineering with complex state management libraries unless a clear need arises.
*   **Forms & Validation:**
    *   **Libraries:** Use `react-hook-form` for form management and `zod` for schema validation.
*   **Icons:**
    *   **Library:** Use `lucide-react` for all icons.
*   **Backend & Database Interactions:**
    *   **Platform:** Use Supabase.
    *   **Client:** Interact with Supabase services (Auth, Database, Storage, Edge Functions) via the `@supabase/supabase-js` client.
*   **AI Integrations:**
    *   **Service Layer:** Always interact with AI models through the services defined in `src/services/` (e.g., `aiService`, `imageService`, `streamingService`). This layer handles model routing, error handling, and API key management.
*   **Code Editing Interfaces:**
    *   **Library:** Use `@monaco-editor/react` for any in-app code editing functionality.
*   **Date Manipulation:**
    *   **Library:** Use `date-fns` for all date parsing, formatting, and manipulation tasks.
*   **Toasts/Notifications:**
    *   **Library:** Use `sonner` for displaying user notifications and toasts.
*   **In-Browser Sandboxing:**
    *   **Library:** Use `@webcontainer/api` for creating isolated development environments within the browser.
*   **Document Generation:**
    *   **Libraries:** Use `pdf-lib` for PDF generation, `docx` for Word documents, `pptxgenjs` for PowerPoint presentations, and `epub-gen` for EPUB files.