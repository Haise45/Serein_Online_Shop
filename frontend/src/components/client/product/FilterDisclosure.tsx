"use client";
import { Disclosure, Transition } from '@headlessui/react';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';

interface FilterDisclosureProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function FilterDisclosure({ title, children, defaultOpen = true }: FilterDisclosureProps) {
  return (
    <Disclosure as="div" defaultOpen={defaultOpen} className="border-b border-gray-200 py-6">
      {({ open }) => (
        <>
          <Disclosure.Button className="flex w-full items-center justify-between text-left text-gray-700 hover:text-gray-900">
            <span className="font-medium">{title}</span>
            <span className="ml-2 flex items-center">
              {open ? (
                <FiChevronUp className="h-5 w-5" aria-hidden="true" />
              ) : (
                <FiChevronDown className="h-5 w-5" aria-hidden="true" />
              )}
            </span>
          </Disclosure.Button>
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Disclosure.Panel className="pt-4 space-y-3">
                {children}
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  );
}