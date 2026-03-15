import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | GodsEye MCP Server',
    description: 'Privacy Policy for the GodsEye Model Context Protocol (MCP) Server.',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 p-8 sm:p-12">
                <div className="space-y-8 text-gray-700 dark:text-gray-300">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy for GodsEye MCP Server</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Effective Date: March 2, 2026</p>
                    </div>

                    <section>
                        <p className="leading-relaxed">
                            This Privacy Policy explains how the GodsEye Model Context Protocol (MCP) Server collects, uses, and retains data when you interact with it through Anthropic&apos;s Claude or other supported MCP clients.
                        </p>
                        <p className="leading-relaxed mt-4">
                            GodsEye is built with a privacy-forward, stateless architecture designed to act strictly as an intelligent reading lens for Answer Engine Optimization (AEO) data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">1. Data Collection</h2>
                        <p className="mb-4">We collect only the absolute minimum data necessary to fulfill your specific requests.</p>

                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6 mb-2">Information provided by your MCP Client:</h3>
                        <p className="mb-4">When you trigger an analysis, the GodsEye MCP Server receives only the following arguments from your client:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-6">
                            <li><strong>product_id:</strong> A unique identifier (UUID) used strictly to locate and fetch the correct product data from our database.</li>
                            <li><strong>intent:</strong> Your verbatim prompt or question detailing the analysis you are requesting.</li>
                            <li><strong>query_filter:</strong> An optional text string used to narrow down specific search results.</li>
                        </ul>

                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6 mb-2">Information retrieved from our Database:</h3>
                        <p className="mb-6">
                            To fulfill your request, the server temporarily fetches relevant AEO data associated with your product_id. This includes product metadata, strategist data (Share of Voice scores, AI narratives), detective data (query rankings, citations), and architect data (optimization blueprints).
                        </p>

                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6 mb-2">What we DO NOT collect:</h3>
                        <p>
                            The GodsEye MCP Server does not collect, read, or store extraneous conversation data, your chat history, user-uploaded files, or personal information from your Claude environment.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">2. Data Usage</h2>
                        <p className="mb-4">All data processed by the GodsEye MCP Server is used contextually and strictly in transit.</p>
                        <ul className="space-y-4">
                            <li>
                                <strong>Request Routing &amp; Planning:</strong> Your intent is passed to our third-party LLM provider (Google Gemini 2.5 Flash) alongside basic dataset metrics (e.g., row counts) to calculate and plan the necessary database queries.
                            </li>
                            <li>
                                <strong>Iterative Summarization:</strong> To prevent token overflow when handling massive datasets, fetched database data is temporarily passed to the LLM to generate summarized narratives and assemble a highly compressed, formatted response for your client.
                            </li>
                            <li>
                                <strong>Read-Only Operations:</strong> The GodsEye MCP Server operates with strict <code>readOnlyHint: true</code> parameters. It never writes, updates, or deletes any data in the backend database.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">3. Data Retention</h2>
                        <p className="mb-4">Our server is entirely stateless. We do not store your data after your session concludes.</p>
                        <ul className="space-y-4">
                            <li>
                                <strong>In-Memory Processing:</strong> All request data, fetched database rows, and generated summaries are held in volatile memory tied to your active server connection.
                            </li>
                            <li>
                                <strong>30-Minute Purge Rule:</strong> The server employs an active internal garbage collection system. If a session experiences 30 minutes of inactivity, the session is permanently purged, the transport stream is destroyed, and the memory is cleared.
                            </li>
                            <li>
                                <strong>No Disk Storage:</strong> The server does not write any log files, cache files, or database rows containing your prompts or the fetched data. Once the node process closes or the session is purged, all traces of the transaction completely disappear from the MCP server.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">4. Third-Party Processors</h2>
                        <p>
                            To facilitate data planning and summarization, we securely transmit your intent and temporarily fetched data to the Google Gemini API. This data is processed in transit and is subject to Google&apos;s enterprise API data retention policies, which dictate that API data is not used to train foundational AI models.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">5. Contact Us</h2>
                        <p className="mb-2">If you have any questions about this Privacy Policy or how your data is handled, please contact us at:</p>
                        <p>
                            <strong>Email:</strong> <a href="mailto:godseye3002@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">godseye3002@gmail.com</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
